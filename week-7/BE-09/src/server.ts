// Express API — week-7/BE-09 "Visual AI workflow".
//
// Phase 1: /health + Inngest function discovery. Phase 3 adds the execution
// surface: POST /runs accepts a graph from the React Flow editor, saves a run,
// dispatches the workflow/run.requested event and answers 202 instantly; the
// run-workflow function walks the graph (see functions.ts) while GET /runs/:id
// reports traversal progress (path, current node, YES/NO trace).
//
// Inngest wiring (from BE-06): the serve adapter at /api/inngest reads
// req.body, so express.json() MUST run before it. And the app must be in dev
// mode (INNGEST_DEV=1, set in the npm scripts) or the SDK stays in cloud mode
// and 401s the Dev Server's runs.
import express from "express";
import { serve } from "inngest/express";
import { inngest, functions } from "./functions.js";
import { config } from "./config.js";
import { runStore, type RunEdge, type RunNode } from "./store.js";
import { randomUUID } from "node:crypto";

const app = express();

app.use(express.json());

// The site runs on :3001 while the API runs on :3000. Allow the browser to call
// it (no extra dependency — one middleware).
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Accept now, work later: validate the graph at the door (400 for garbage, no
// event sent), record a queued run, dispatch the run to Inngest, answer 202.
app.post("/runs", (req, res) => {
  const nodes: unknown = (req.body as { nodes?: unknown })?.nodes;
  const edges: unknown = (req.body as { edges?: unknown })?.edges;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    res.status(400).json({ error: "nodes array is required and must be non-empty" });
    return;
  }
  if (!Array.isArray(edges)) {
    res.status(400).json({ error: "edges array is required" });
    return;
  }

  const typedNodes = nodes as RunNode[];
  const startNodeId =
    typedNodes.find((n) => n.type === "start")?.id ?? typedNodes[0]?.id ?? "";

  const id = randomUUID();
  runStore.create(id, startNodeId, typedNodes, edges as RunEdge[]);

  inngest
    .send({
      name: "workflow/run.requested",
      data: { runId: id, nodes: typedNodes, edges, startNodeId },
    })
    .catch((err: unknown) => console.error("[runs] failed to send event:", err));

  res.status(202).json({ id, status: "queued", startNodeId });
});

// Report execution progress: queued -> running (with live path) -> done + trace,
// or failed. Unknown id -> 404.
app.get("/runs/:id", (req, res) => {
  const run = runStore.get(req.params.id);
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  res.status(200).json(run);
});

// Inngest function discovery + execution. The Dev Server posts here to learn
// about engine-ping / run-workflow and to dispatch their runs.
app.use("/api/inngest", serve({ client: inngest, functions }));

const server = app.listen(config.port, () => {
  console.log(`[ai-workflow] server on :${config.port}`);
});

const shutdown = (): void => {
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
