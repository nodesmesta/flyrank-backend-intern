// Phase 4 persistence helpers — run history log, named workflow slots, and
// JSON export/import. All in localStorage (the graph already lives there too).
import type { Run, RunEdge, RunNode } from "./api";

/** A node/edge as persisted (positions preserved); a superset of RunNode so the
 * same objects can be POSTed to /runs by dropping position first. */
export interface SavedNode {
  id: string;
  type: string;
  position?: { x: number; y: number };
  data: Record<string, unknown>;
}
export interface SavedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  data?: { branch?: "yes" | "no" | "next" };
}
export interface SavedGraph {
  name?: string;
  nodes: SavedNode[];
  edges: SavedEdge[];
}

export interface RunLogEntry {
  id: string;
  status: Run["status"];
  outcome?: string;
  error?: string;
  path: string[];
  trace: Run["trace"];
  ts: string;
}

export interface Workspace extends SavedGraph {
  savedAt: string;
}

const RUNLOG_KEY = "be9:runlog:v1";
const WORKSPACES_KEY = "be9:workspaces:v1";
const MAX_LOG = 12;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

// --- Run history log (persisted, newest first, capped) ---
export function getRunLog(): RunLogEntry[] {
  return read<RunLogEntry[]>(RUNLOG_KEY, []);
}

export function pushRunLog(run: Run): RunLogEntry[] {
  const entry: RunLogEntry = {
    id: run.id,
    status: run.status,
    outcome: run.result?.outcome,
    error: run.error,
    path: run.path,
    trace: run.trace,
    ts: new Date().toISOString(),
  };
  const next = [entry, ...getRunLog()].slice(0, MAX_LOG);
  write(RUNLOG_KEY, next);
  return next;
}

// --- Named workflow slots (save / load) ---
export function listWorkspaces(): Workspace[] {
  return read<Workspace[]>(WORKSPACES_KEY, []);
}

export function saveWorkspace(name: string, nodes: SavedNode[], edges: SavedEdge[]): Workspace[] {
  const all = listWorkspaces().filter((w) => w.name !== name);
  const next: Workspace[] = [{ name, savedAt: new Date().toISOString(), nodes, edges }, ...all].slice(0, 12);
  write(WORKSPACES_KEY, next);
  return next;
}

export function deleteWorkspace(name: string): Workspace[] {
  const next = listWorkspaces().filter((w) => w.name !== name);
  write(WORKSPACES_KEY, next);
  return next;
}

// --- JSON export / import ---
export function downloadGraph(name: string, nodes: SavedNode[], edges: SavedEdge[]): void {
  const blob = new Blob([JSON.stringify({ name, nodes, edges }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `be9-workflow-${name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "graph"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseGraphFile(file: File): Promise<SavedGraph> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("could not read file"));
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as SavedGraph;
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          throw new Error("file does not look like a workflow (need nodes and edges arrays)");
        }
        resolve(parsed);
      } catch (e) {
        reject(e instanceof Error ? e : new Error("invalid JSON"));
      }
    };
    reader.readAsText(file);
  });
}
