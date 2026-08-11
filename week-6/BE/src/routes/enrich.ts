// POST /enrich — the endpoint. Stage 2: the model is wired in; its raw text is
// returned as-is (Stage 3 wraps it in parse + validate + repair + quarantine).
import { Router } from "express";
import type { Config } from "../llm/config.js";
import { complete } from "../llm/client.js";
import { buildUserMessage, loadSystemPrompt } from "../llm/prompt.js";
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

    // 3. Real model path.
    try {
      const raw = await complete(cfg, loadSystemPrompt(), buildUserMessage(record));
      // Stage 2 only: return whatever the model said. From Stage 3 the caller
      // gets the validated schema — never raw model text.
      res.status(200).json({ raw_model_output: raw });
    } catch (err) {
      res.status(502).json({ error: `Model call failed: ${(err as Error).message}` });
    }
  });

  return router;
}
