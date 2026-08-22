// In-memory run store — one map, per the assignment's "safe to forget" design.
// A run holds the submitted graph plus the live execution state (path, current
// node, trace) so GET /runs/:id can show traversal progress as it happens.
export interface RunNode {
  id: string;
  type: "start" | "decision" | "end";
  data: Record<string, unknown>;
}

export interface RunEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  data?: { branch?: "yes" | "no" | "next" };
}

export interface TraceStep {
  nodeId: string;
  prompt: string;
  answer: "YES" | "NO";
  model?: string;
  at: string;
}

export interface Run {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  startNodeId: string;
  nodes: RunNode[];
  edges: RunEdge[];
  createdAt: string;
  updatedAt: string;
  /** node ids in execution order */
  path: string[];
  /** the node currently being decided (live) */
  currentNodeId: string | null;
  trace: TraceStep[];
  result?: { endNodeId: string; outcome?: string };
  error?: string;
}

class RunStore {
  private runs = new Map<string, Run>();

  create(id: string, startNodeId: string, nodes: RunNode[], edges: RunEdge[]): Run {
    const now = new Date().toISOString();
    const run: Run = { id, status: "queued", startNodeId, nodes, edges, createdAt: now, updatedAt: now, path: [], currentNodeId: null, trace: [] };
    this.runs.set(id, run);
    return run;
  }

  get(id: string): Run | undefined {
    return this.runs.get(id);
  }

  /** mutate + bump updatedAt */
  private touch(id: string, fn: (r: Run) => void): void {
    const run = this.runs.get(id);
    if (!run) return;
    fn(run);
    run.updatedAt = new Date().toISOString();
  }

  setRunning(id: string): void {
    this.touch(id, (r) => (r.status = "running"));
  }

  setCurrent(id: string, nodeId: string | null): void {
    this.touch(id, (r) => (r.currentNodeId = nodeId));
  }

  pushPath(id: string, nodeId: string): void {
    this.touch(id, (r) => r.path.push(nodeId));
  }

  addTrace(id: string, step: Omit<TraceStep, "at">): void {
    this.touch(id, (r) => r.trace.push({ ...step, at: new Date().toISOString() }));
  }

  finish(id: string, nodeId: string, outcome?: string): void {
    this.touch(id, (r) => {
      r.status = "done";
      r.currentNodeId = null;
      r.result = { endNodeId: nodeId, outcome };
    });
  }

  fail(id: string, error: string): void {
    this.touch(id, (r) => {
      r.status = "failed";
      r.currentNodeId = null;
      r.error = error;
    });
  }

  statusCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const r of this.runs.values()) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  }
}

export const runStore = new RunStore();
