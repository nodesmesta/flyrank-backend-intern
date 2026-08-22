// Thin client for the BE-09 backend (Express + Inngest). The site talks to
// the backend at `NEXT_PUBLIC_API_URL` (default localhost:3000).

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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
  path: string[];
  currentNodeId: string | null;
  trace: TraceStep[];
  result?: { endNodeId: string; outcome?: string };
  error?: string;
}

export async function startRun(nodes: RunNode[], edges: RunEdge[]): Promise<Run> {
  const res = await fetch(`${API_BASE}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodes, edges }),
  });
  const body = (await res.json().catch(() => ({}))) as Partial<Run>;
  if (!res.ok) throw new Error(body.error ?? "failed to start run");
  // The 202 body is just { id, status, startNodeId } — pad the fields the
  // editor reads so a running run never sees an undefined path/trace.
  return { path: [], trace: [], result: undefined, error: undefined, ...body } as Run;
}

export async function fetchRun(id: string): Promise<Run> {
  const res = await fetch(`${API_BASE}/runs/${id}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "run not found");
  return body as Run;
}
