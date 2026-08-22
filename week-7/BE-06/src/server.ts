// Express API — week-7/BE-06 "Your first background job".
//
// The fast door: POST /reports answers 202 in under a second and hands the slow
// work (~8 s) to a background function. GET /reports/:id reports progress
// (pending -> done). Inngest's Dev Server discovers the three functions over
// /api/inngest and runs them; the dashboard at localhost:8288 shows every run.
import express from "express";
import { serve } from "inngest/express";
import { inngest, functions } from "./functions.js";
import { reportStore } from "./store.js";

const PORT = Number(process.env.PORT ?? 3000);

const app = express();

// Parse JSON on every route. The Inngest serve handler at /api/inngest reads
// req.body, so this middleware must run before it (per the adapter docs).
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Accept now, work later: validate the topic at the door (400 + no event for
// garbage), record a pending report, send the event, answer 202 immediately.
app.post("/reports", (req, res) => {
  const topic: unknown = (req.body as { topic?: unknown } | undefined)?.topic;
  if (typeof topic !== "string" || topic.trim().length === 0) {
    res.status(400).json({ error: "topic is required" });
    return;
  }

  const report = reportStore.create(topic.trim());
  // Fire-and-forget: the Dev Server picks the event up in dev. Not awaited so
  // the endpoint stays fast even if the scheduler is momentarily slow.
  inngest
    .send({ name: "report/requested", data: { id: report.id, topic: report.topic } })
    .catch((err: unknown) => console.error("[reports] failed to send event:", err));

  res.status(202).json({ id: report.id, status: report.status });
});

// Eventual consistency at its simplest: pending first, done + result later.
app.get("/reports/:id", (req, res) => {
  const report = reportStore.get(req.params.id);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.status(200).json(report);
});

// Inngest function discovery + execution. The Dev Server posts here to learn
// about say-hello / make-report / heartbeat and to dispatch their runs.
app.use("/api/inngest", serve({ client: inngest, functions }));

const server = app.listen(PORT, () => {
  console.log(`[reports] server on :${PORT}`);
});

const shutdown = (): void => {
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
