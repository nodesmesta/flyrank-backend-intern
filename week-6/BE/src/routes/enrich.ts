// POST /enrich — the endpoint. Stage 3: parse + validate + repair once +
// quarantine; the caller only ever receives the validated schema.
import { Router } from "express";
import type { Config } from "../llm/config.js";
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

    // 2. Stub mode: skip the model entirely, return a schema-valid object.
    if (cfg.llmStub) {
      res.status(200).json(stubOutput());
      return;
    }

    // 3. Real model path — validated schema out, or a clear 422.
    try {
      const output = await enrichWithRepair(cfg, loadSystemPrompt(), buildUserMessage(record), record);
      res.status(200).json(output);
    } catch (err) {
      if (err instanceof UnrepairableOutputError) {
        res.status(422).json({ error: err.message });
        return;
      }
      res.status(502).json({ error: `Model call failed: ${(err as Error).message}` });
    }
  });

  return router;
}
