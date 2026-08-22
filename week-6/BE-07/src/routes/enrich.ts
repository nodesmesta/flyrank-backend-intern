// POST /enrich — the endpoint. Stage 4: kill switch, real timeout (504) and
// explicit retry policy live in llm/client.ts; parse + validate + repair once
// + quarantine live in llm/parse.ts. The caller only ever receives the
// validated schema.
import { Router } from "express";
import type { Config } from "../llm/config.js";
import { LlmRetriesExhaustedError, LlmTimeoutError } from "../llm/client.js";
import { buildUserMessage, loadSystemPrompt } from "../llm/prompt.js";
import { enrichWithRepair, UnrepairableOutputError } from "../llm/parse.js";
import { enrichInputSchema, stubOutput } from "../llm/schema.js";

export function createEnrichRouter(cfg: Config): Router {
  const router = Router();

  router.post("/enrich", async (req, res) => {
    // 1. Validate the input BEFORE anything else — every rejected request is
    //    a model call we did not pay for.
    const parsed = enrichInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(".") || "(body)";
      res.status(400).json({ error: `Invalid field "${field}": ${issue.message}` });
      return;
    }
    const { record } = parsed.data;

    // 2. Kill switch: LLM_ENABLED=false skips the model entirely and answers
    //    immediately with a deterministic 503 — zero model calls, no deploy
    //    needed when the provider misbehaves.
    if (!cfg.llmEnabled) {
      res.status(503).json({ error: "AI enrichment is disabled (LLM_ENABLED=false)" });
      return;
    }

    // 3. Stub mode: skip the model entirely, return a schema-valid object.
    if (cfg.llmStub) {
      res.status(200).json(stubOutput());
      return;
    }

    // 4. Real model path — validated schema out, or a clear 422/504/502.
    try {
      const output = await enrichWithRepair(cfg, loadSystemPrompt(), buildUserMessage(record), record);
      res.status(200).json(output);
    } catch (err) {
      if (err instanceof UnrepairableOutputError) {
        res.status(422).json({ error: err.message });
        return;
      }
      if (err instanceof LlmTimeoutError) {
        res.status(504).json({ error: err.message });
        return;
      }
      if (err instanceof LlmRetriesExhaustedError) {
        res.status(502).json({ error: err.message });
        return;
      }
      res.status(502).json({ error: `Model call failed: ${(err as Error).message}` });
    }
  });

  return router;
}
