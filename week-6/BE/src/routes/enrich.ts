// POST /enrich — the endpoint. Stage 1: contract + validation + stub mode,
// no model call yet (that is Stage 2).
import { Router } from "express";
import type { Config } from "../llm/config.js";
import { enrichInputSchema, stubOutput } from "../llm/schema.js";

export function createEnrichRouter(cfg: Config): Router {
  const router = Router();

  router.post("/enrich", (req, res) => {
    // 1. Validate the input BEFORE anything else — every rejected request is
    //    a model call we did not pay for.
    const parsed = enrichInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(".") || "(body)";
      res.status(400).json({ error: `Invalid field "${field}": ${issue.message}` });
      return;
    }

    // 2. Stub mode: skip the model entirely, return a schema-valid object.
    if (cfg.llmStub) {
      res.status(200).json(stubOutput());
      return;
    }

    // 3. Real model path — wired in Stage 2.
    res.status(501).json({ error: "Model call not wired yet (Stage 2)" });
  });

  return router;
}
