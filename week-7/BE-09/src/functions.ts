// Inngest functions — week-7/BE-09 "Visual AI workflow".
//
// Phase 1 ships a single ping function so the Dev Server can discover and run
// something over /api/inngest (the same proof as BE-06's say-hello). Phase 3
// replaces it with the real workflow executor: one Inngest function whose steps
// walk the graph, send each node's prompt to the LLM, and follow the returned
// YES/NO edge.
//
// SDK note (inngest v4+): the trigger lives INSIDE the options object —
// `createFunction({ id, triggers: { event|cron }, ... }, handler)`, not the
// older three-argument form.
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "ai-workflow" });

// A handshake function: send `workflow/ping` and it replies "pong". Proves the
// Dev Server ↔ app loop is wired before any real workflow logic exists.
export const enginePing = inngest.createFunction(
  { id: "engine-ping", triggers: { event: "workflow/ping" } },
  async () => "pong from the AI workflow engine",
);

export const functions = [enginePing];
