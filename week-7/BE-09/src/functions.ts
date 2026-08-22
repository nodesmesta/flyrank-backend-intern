// Inngest functions — week-7/BE-09 "Visual AI workflow".
//
// Phase 1 shipped a ping function to prove the Dev Server loop. Phase 3 adds
// run-workflow, the executor: an Inngest function whose steps walk the graph,
// send each decision node's prompt to the LLM, and follow the returned YES/NO
// edge. Every decision node maps to an Inngest `step.run`, exactly as the brief
// requires.
//
// SDK note (inngest v4+): the trigger lives INSIDE the options object —
// `createFunction({ id, triggers: { event|cron }, ... }, handler)`, not the
// older three-argument form.
import { Inngest } from "inngest";
import { runStore, type RunEdge, type RunNode } from "./store.js";
import { decide } from "./llm/client.js";
import { config } from "./config.js";

export const inngest = new Inngest({ id: "ai-workflow" });

// A handshake function: send `workflow/ping` and it replies "pong". Proves the
// Dev Server ↔ app loop is wired before any real workflow logic exists.
export const enginePing = inngest.createFunction(
  { id: "engine-ping", triggers: { event: "workflow/ping" } },
  async () => "pong from the AI workflow engine",
);

// The Phase 3 executor. Starts at the run's start node and walks the graph:
//   start    -> follow the single "next" edge
//   decision -> ask the LLM for YES/NO (step.run per node), follow that branch
//   end      -> the run is done; record the outcome label
// Each visit is pushed to the run's path and current node, so GET /runs/:id
// reports traversal order live.
export const runWorkflow = inngest.createFunction(
  {
    id: "run-workflow",
    retries: 1,
    triggers: { event: "workflow/run.requested" },
    onFailure: async ({ event }) => {
      const original = event.data.event as { data?: { runId?: string } };
      const runId = original?.data?.runId;
      if (runId) runStore.fail(runId, "Workflow run failed after retries");
    },
  },
  async ({ event, step }) => {
    const { runId, nodes, edges, startNodeId } = event.data as {
      runId: string;
      nodes: RunNode[];
      edges: RunEdge[];
      startNodeId: string;
    };

    runStore.setRunning(runId);

    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const outgoing = (id: string) => edges.filter((e) => e.source === id);
    const MAX_STEPS = 50;

    let current = runStore.get(runId)?.startNodeId ?? startNodeId;

    for (let i = 0; i < MAX_STEPS; i++) {
      runStore.pushPath(runId, current);
      runStore.setCurrent(runId, current);

      const node = nodeById.get(current);
      if (!node) {
        runStore.fail(runId, `Node "${current}" not found in the graph`);
        return { status: "failed", error: `node ${current} missing` };
      }

      // Reached an end node -> the workflow is done.
      if (node.type === "end") {
        const outcome = typeof node.data.label === "string" ? node.data.label : undefined;
        runStore.finish(runId, current, outcome);
        return { status: "done", endNodeId: current, outcome: outcome ?? null };
      }

      const out = outgoing(current);

      // Start nodes forward along the single neutral edge.
      if (node.type === "start") {
        const nextEdge = out.find((e) => e.data?.branch === "next") ?? out[0];
        if (!nextEdge) {
          runStore.fail(runId, `Start node "${current}" has no outgoing edge`);
          return { status: "failed", error: "start node not connected" };
        }
        current = nextEdge.target;
        continue;
      }

      // Decision nodes ask the LLM, then follow the YES/NO edge.
      if (node.type === "decision") {
        const prompt = typeof node.data.prompt === "string" ? node.data.prompt : "(no prompt)";
        const answer = await step.run(`decide-${current}`, async () => decide(prompt));
        runStore.addTrace(runId, { nodeId: current, prompt, answer, model: config.llmModel });

        const nextEdge = out.find((e) => e.data?.branch === answer.toLowerCase());
        if (!nextEdge) {
          runStore.fail(runId, `No ${answer} edge from decision node "${current}"`);
          return { status: "failed", error: `no ${answer} branch` };
        }
        current = nextEdge.target;
        continue;
      }

      runStore.fail(runId, `Unknown node type "${String(node.type)}"`);
      return { status: "failed", error: `unknown node type ${node.type}` };
    }

    runStore.fail(runId, "Max steps reached (possible cycle)");
    return { status: "failed", error: "cycle / max steps" };
  },
);

export const functions = [enginePing, runWorkflow];

