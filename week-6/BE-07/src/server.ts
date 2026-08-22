// Entry point — Express API with one AI-backed endpoint (POST /enrich).
// Same shape as the earlier BE assignments (BE-02/BE-03): express + json body
// parsing + a route module; config lives in week-6/BE-07/.env.
import express from "express";
import { loadConfig } from "./llm/config.js";
import { createEnrichRouter } from "./routes/enrich.js";

const cfg = loadConfig();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(createEnrichRouter(cfg));

const server = app.listen(cfg.port, () => {
  console.log(`[enrich] server on :${cfg.port} (stub=${cfg.llmStub} enabled=${cfg.llmEnabled})`);
});

// Clean shutdown so port 3000/3100 is never left occupied between test runs.
const shutdown = (): void => {
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
