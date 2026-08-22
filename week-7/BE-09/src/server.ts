// Express API — week-7/BE-09 "Visual AI workflow".
//
// Phase 1: liveness probe + the Inngest function-discovery endpoint. The Next.js
// site (site/) renders the React Flow editor; the executor endpoints that turn
// a graph into an LLM run land here in Phase 3.
//
// Inngest wiring (from BE-06): the serve adapter at /api/inngest reads
// req.body, so express.json() MUST run before it. And the app must be in dev
// mode (INNGEST_DEV=1, set in the npm scripts) or the SDK stays in cloud mode
// and 401s the Dev Server's runs.
import express from "express";
import { serve } from "inngest/express";
import { inngest, functions } from "./functions.js";
import { port } from "./config.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Inngest function discovery + execution. The Dev Server posts here to learn
// about engine-ping and to dispatch its runs.
app.use("/api/inngest", serve({ client: inngest, functions }));

const server = app.listen(port, () => {
  console.log(`[ai-workflow] server on :${port}`);
});

const shutdown = (): void => {
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
