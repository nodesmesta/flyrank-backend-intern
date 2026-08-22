// The three Inngest functions — week-7/BE-06.
//
// They show the three ways work can start:
//   say-hello  -> started by a one-off event   (test/hello)
//   make-report-> started by a client request  (report/requested) — the slow work
//   heartbeat  -> started by the clock         (cron, every minute)
//
// The slow work is `step.sleep(..., "8s")`, a stand-in for a real slow task
// (an AI call, a big export) exactly as the assignment prescribes. The Dev
// Server gives each finished step a visual record in the dashboard.
// SDK note: inngest v4+ moved the trigger inside the options object, so a
// function is `createFunction({ id, triggers: { event/cron }, ... }, handler)`
// rather than the older three-argument form.
import { Inngest } from "inngest";
import { reportStore } from "./store.js";

export const inngest = new Inngest({ id: "report-api" });

export const sayHello = inngest.createFunction(
  { id: "say-hello", triggers: { event: "test/hello" } },
  async ({ step }) => {
    await step.sleep("do-the-slow-work", "5s");
    return "Hello from the background!";
  },
);

export const makeReport = inngest.createFunction(
  {
    id: "make-report",
    retries: 2,
    triggers: { event: "report/requested" },
    // When the build step exhausts its retries, Inngest fires the internal
    // function.failed event; flip the report to "failed" so the status endpoint
    // and the heartbeat summary reflect it (pending / done / failed).
    onFailure: async ({ event }) => {
      const original = event.data.event as { data?: { id?: string } };
      const id = original?.data?.id;
      if (id) reportStore.setStatus(id, "failed");
    },
  },
  async ({ event, step }) => {
    const { id, topic } = event.data as { id: string; topic: string };

    // Idempotency: jobs may run twice; an idempotent job causes the effect
    // once. If this report was already built, build nothing a second time.
    if (reportStore.get(id)?.status === "done") {
      return { id, status: "done", result: reportStore.get(id)?.result };
    }

    // The slow work, kept out of the request path entirely.
    await step.sleep("do-the-slow-work", "8s");

    const result = await step.run("build-report", async () => {
      // Stage 3 retry demo: at the top of the build step we fail the "fail"
      // topic. retries: 2 is what lets the dashboard show attempts 1..3
      // before the run ends Failed, with backoff growing between attempts.
      if (topic === "fail") {
        throw new Error("The report oven is broken!");
      }
      const text = `Report for "${topic}": crawled, headings extracted, content indexed.`;
      reportStore.setStatus(id, "done", text);
      return text;
    });

    return { id, status: "done", result };
  },
);

export const heartbeat = inngest.createFunction(
  { id: "heartbeat", triggers: { cron: "* * * * *" } },
  async () => {
    const counts = reportStore.statusCounts();
    const summary = `pending=${counts.pending} done=${counts.done} failed=${counts.failed}`;
    console.log(`[heartbeat] ${new Date().toISOString()} ${summary}`);
    return { summary };
  },
);

export const functions = [sayHello, makeReport, heartbeat];
