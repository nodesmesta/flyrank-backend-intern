"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
} from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { DecisionNode, EndNode, StartNode } from "./nodes";
import { FlowEdge, NoEdge, YesEdge } from "./edges";
import { fetchRun, startRun, type Run } from "@/lib/api";
import {
  deleteWorkspace,
  downloadGraph,
  getRunLog,
  listWorkspaces,
  parseGraphFile,
  pushRunLog,
  saveWorkspace,
  type RunLogEntry,
  type Workspace,
} from "@/lib/persistence";
import {
  PALETTE,
  STORAGE_KEY,
  branchShape,
  type AppEdge,
  type AppNode,
  type AppNodeData,
  type Branch,
} from "./types";

const nodeTypes = { decision: DecisionNode, start: StartNode, end: EndNode };
const edgeTypes = { yesedge: YesEdge, noedge: NoEdge, flowedge: FlowEdge };

function arrow(branch: Branch) {
  const color =
    branch === "yes" ? "#059669" : branch === "no" ? "#e11d48" : "#78716c";
  return { type: MarkerType.ArrowClosed, color } as const;
}

/** The two-branch example from the brief, preloaded so the editor is not empty. */
const defaultNodes: AppNode[] = [
  { id: "start", type: "start", position: { x: 40, y: 180 }, data: { kind: "start", label: "Request arrives" } },
  { id: "gate", type: "decision", position: { x: 330, y: 160 }, data: { kind: "decision", prompt: "Is this a support request?" } },
  { id: "support", type: "end", position: { x: 680, y: 20 }, data: { kind: "end", label: "Support queue" } },
  { id: "sales", type: "end", position: { x: 680, y: 290 }, data: { kind: "end", label: "Sales queue" } },
];

const defaultEdges: AppEdge[] = [
  { id: "e0", source: "start", target: "gate", sourceHandle: "next", type: "flowedge", data: { branch: "next" }, markerEnd: arrow("next") },
  { id: "e1", source: "gate", target: "support", sourceHandle: "yes", type: "yesedge", data: { branch: "yes" }, markerEnd: arrow("yes") },
  { id: "e2", source: "gate", target: "sales", sourceHandle: "no", type: "noedge", data: { branch: "no" }, markerEnd: arrow("no") },
];

type SavedGraph = { nodes: AppNode[]; edges: AppEdge[] };

function loadState(): SavedGraph | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedGraph;
    if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return parsed;
  } catch {
    /* corrupted storage → fall back to default */
  }
  return null;
}

function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(defaultEdges);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [running, setRunning] = useState(false);
  const [runLog, setRunLog] = useState<RunLogEntry[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Everything below reads localStorage, which exists only on the client. Load
  // it AFTER mount so the server-rendered first paint matches the client — a
  // saved graph or run log must not cause a hydration mismatch on reload.
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setNodes(saved.nodes);
      setEdges(saved.edges);
    }
    setRunLog(getRunLog());
    setWorkspaces(listWorkspaces());
  }, [setNodes, setEdges]);
  const [saveName, setSaveName] = useState("");
  const [loadName, setLoadName] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(true);
  const lastGraphRef = useRef<{ nodes: Parameters<typeof startRun>[0]; edges: Parameters<typeof startRun>[1]; name?: string } | null>(null);
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Send the given graph to the backend, then poll /runs/:id until the executor
  // finishes, so the traversal (path + YES/NO trace) streams in. On completion
  // the outcome is appended to the persistent run log.
  const execute = useCallback(
    async (graph: { nodes: Parameters<typeof startRun>[0]; edges: Parameters<typeof startRun>[1] }) => {
      lastGraphRef.current = graph;
      setLastAction("Starting workflow run…");
      setRunning(true);
      try {
        const started = await startRun(graph.nodes, graph.edges);
        setRun(started);
        for (let i = 0; i < 80; i++) {
          await new Promise((r) => setTimeout(r, 900));
          if (!aliveRef.current) return;
          const next = await fetchRun(started.id);
          setRun(next);
          if (next.status === "done" || next.status === "failed") {
            setRunning(false);
            setRunLog(pushRunLog(next));
            setLastAction(
              next.status === "done"
                ? `Done → ${next.result?.outcome ?? "finished"}`
                : `Failed: ${next.error ?? "unknown error"}`,
            );
            return;
          }
        }
        setRunning(false);
        setLastAction("Timed out waiting for the run");
      } catch (err) {
        setRunning(false);
        setLastAction(err instanceof Error ? err.message : "Could not start the run");
      }
    },
    [],
  );

  const runNow = useCallback(() => {
    const graph = {
      nodes: nodes.map(({ id, type, data }) => ({ id, type, data })),
      edges: edges.map(({ id, source, target, sourceHandle, data }) => ({
        id,
        source,
        target,
        sourceHandle: sourceHandle ?? undefined,
        data,
      })),
    };
    void execute(graph);
  }, [nodes, edges, execute]);

  const retryRun = useCallback(() => {
    if (!lastGraphRef.current) return;
    void execute(lastGraphRef.current);
  }, [execute]);

  // Edges actually traversed during the run — animate them (dashed flow) and
  // thicken the active branch so the taken path is visible on the canvas.
  const takenEdgeIds = useMemo(() => {
    const p = run?.path ?? [];
    const set = new Set<string>();
    for (let i = 0; i + 1 < p.length; i++) {
      const e = edges.find((ed) => ed.source === p[i] && ed.target === p[i + 1]);
      if (e) set.add(e.id);
    }
    return set;
  }, [run, edges]);
  const displayEdges = useMemo(
    () =>
      edges.map((e) =>
        takenEdgeIds.has(e.id)
          ? { ...e, animated: true, style: { ...e.style, strokeWidth: 5 } }
          : e,
      ),
    [edges, takenEdgeIds],
  );

  // Highlight the node currently being decided (blue ring) and already-visited
  // nodes (faded) during a run.
  const visitedIds = useMemo(
    () => new Set<string>(run?.status === "running" || run?.status === "done" ? run.path : []),
    [run],
  );
  const activeId = run?.status === "running" ? run.currentNodeId : null;
  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        const cls = n.id === activeId ? "rf-active" : visitedIds.has(n.id) ? "rf-vis" : "";
        return cls ? { ...n, className: cls } : n;
      }),
    [nodes, activeId, visitedIds],
  );

  const statusPill =
    run === null
      ? null
      : run.status === "done"
        ? { text: `Done · ${run.result?.outcome ?? "finished"}`, cls: "bg-emerald-600 text-white" }
        : run.status === "failed"
          ? { text: `Failed · ${run.error}`, cls: "bg-rose-600 text-white" }
          : { text: `Running… (${run.path?.length ?? 0} visited)`, cls: "bg-indigo-600 text-white" };

  // Store graph state locally — every edit persists so a reload keeps the flow.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  }, [nodes, edges]);

  const onConnect = useCallback(
    (conn: Connection) => {
      const branch: Branch =
        conn.sourceHandle === "yes" ? "yes" : conn.sourceHandle === "no" ? "no" : "next";
      const { edgeType } = branchShape(branch);
      const edge: AppEdge = {
        id: `e-${crypto.randomUUID()}`,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle ?? "next",
        targetHandle: conn.targetHandle ?? undefined,
        type: edgeType,
        data: { branch },
        markerEnd: arrow(branch),
      };
      setEdges((eds) => [...eds, edge]);
      setLastAction(`Connected via ${branch.toUpperCase()} (${edgeType})`);
    },
    [setEdges],
  );

  // No self-loops allowed.
  const isValidConnection = useCallback(
    (conn: Connection | AppEdge) => conn.source !== conn.target,
    [],
  );

  const addNode = useCallback(
    (kind: AppNodeData["kind"]) => {
      const item = PALETTE.find((p) => p.kind === kind);
      if (!item) return;
      const id = `${kind}-${crypto.randomUUID().slice(0, 6)}`;
      const offset = (n: number) => ({ x: 120 + (n % 5) * 30, y: 40 + ((n / 5) | 0) * 80 });
      const node: AppNode = { id, type: kind, position: offset(nodes.length), data: item.defaultData };
      setNodes((nds) => [...nds, node]);
      setLastAction(`Added ${item.label} node`);
    },
    [nodes.length, setNodes],
  );

  const resetGraph = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setNodes(defaultNodes);
    setEdges(defaultEdges);
    setLastAction("Reset to the default example");
  }, [setNodes, setEdges]);

  // --- Save / Load / Export / Import ---
  const nodeToSaved = (n: AppNode) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data as Record<string, unknown>,
  });
  const edgeToSaved = (e: AppEdge) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    data: e.data,
  });
  const savedToNodes = (ns: import("@/lib/persistence").SavedNode[]): AppNode[] =>
    ns.map((n, i) => ({
      id: n.id,
      type: n.type as AppNode["type"],
      position: n.position ?? { x: 80 + (i % 4) * 40, y: 30 + ((i / 4) | 0) * 90 },
      data: n.data as AppNode["data"],
    }));
  const savedToEdges = (es: import("@/lib/persistence").SavedEdge[]): AppEdge[] =>
    es.map((e) => {
      const branch = (e.data?.branch ?? "next") as Branch;
      const { edgeType } = branchShape(branch);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        type: edgeType,
        data: { branch },
        markerEnd: arrow(branch),
      };
    });

  const saveGraph = () => {
    const name = saveName.trim();
    if (!name) {
      setLastAction("Type a name, then Save");
      return;
    }
    setWorkspaces(saveWorkspace(name, nodes.map(nodeToSaved), edges.map(edgeToSaved)));
    setSaveName("");
    setLastAction(`Saved "${name}"`);
  };
  const loadGraph = () => {
    const ws = workspaces.find((w) => w.name === loadName);
    if (!ws) {
      setLastAction("Select a saved workflow to load");
      return;
    }
    setNodes(savedToNodes(ws.nodes));
    setEdges(savedToEdges(ws.edges));
    setLastAction(`Loaded "${ws.name}"`);
  };
  const deleteGraph = () => {
    if (!loadName) return;
    setWorkspaces(deleteWorkspace(loadName));
    setLoadName("");
    setLastAction(`Deleted "${loadName}"`);
  };
  const exportGraph = () => {
    downloadGraph(saveName.trim() || "workflow", nodes.map(nodeToSaved), edges.map(edgeToSaved));
    setLastAction("Exported workflow as JSON");
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const g = await parseGraphFile(file);
      setNodes(savedToNodes(g.nodes));
      setEdges(savedToEdges(g.edges));
      setLastAction(`Imported "${g.name ?? file.name}"`);
    } catch (e) {
      setLastAction(e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <div className="h-full w-full">
      <ReactFlow<AppNode, AppEdge>
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={["Delete", "Backspace"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#e7e5e4" />
        <Controls />

        <Panel position="top-left">
          <div className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-white/90 p-2 shadow-sm backdrop-blur">
            <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
              Add a node
            </span>
            <div className="flex flex-col gap-1.5">
              {PALETTE.map((p) => (
                <Button key={p.kind} size="sm" variant="outline" onClick={() => addNode(p.kind)}>
                  + {p.label}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={resetGraph}>
              Reset example
            </Button>
            <div className="my-1 h-px bg-stone-200" />
            <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
              Workflow
            </span>
            <div className="flex items-center gap-1.5">
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="name"
                className="w-24 rounded border border-stone-300 px-2 py-1 text-xs outline-none focus:border-stone-500"
              />
              <Button size="sm" variant="outline" onClick={saveGraph}>
                Save
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={loadName}
                onChange={(e) => setLoadName(e.target.value)}
                className="w-24 rounded border border-stone-300 px-1 py-1 text-xs outline-none"
              >
                <option value="">Load…</option>
                {workspaces.map((w) => (
                  <option key={w.name} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={loadGraph} disabled={!loadName}>
                Load
              </Button>
              <Button size="sm" variant="ghost" onClick={deleteGraph} disabled={!loadName}>
                Del
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="inline-flex cursor-pointer items-center rounded border border-stone-300 px-3 py-1 text-xs text-stone-900 hover:bg-stone-50">
                Import
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    void importFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <Button size="sm" variant="outline" onClick={exportGraph}>
                Export
              </Button>
            </div>
          </div>
        </Panel>

        <Panel position="top-right" className="flex flex-col items-end gap-2">
          <Button onClick={runNow} disabled={running} className="shadow-sm">
            {running ? "Running…" : "Run workflow"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={retryRun}
            disabled={running || !lastGraphRef.current}
            className="shadow-sm"
          >
            Retry last run
          </Button>
        </Panel>

        <Panel position="bottom-center">
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs text-stone-500 shadow-sm backdrop-blur">
            Drag to arrange · drag a dot to connect (a decision forks into YES / NO) · click a
            prompt to edit · select + Del to remove
          </div>
        </Panel>

        <Panel position="bottom-right">
          {statusPill && (
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusPill.cls}`}>
                {statusPill.text}
              </span>
              {run && run.trace.length > 0 && (
                <div className="max-h-40 w-72 overflow-auto rounded-lg border border-stone-200 bg-white/95 p-2 text-xs shadow-sm backdrop-blur">
                  <div className="mb-1 font-semibold text-stone-600">
                    Execution order
                  </div>
                  {run.trace.map((t, i) => (
                    <div key={i} className="flex items-start gap-1.5 border-b border-stone-100 py-1 last:border-0">
                      <span className="text-stone-400">{i + 1}.</span>
                      <span className="flex-1 text-stone-700">{t.prompt}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-bold ${
                          t.answer === "YES" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {t.answer}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel position="bottom-left">
          <div className="w-72 rounded-lg border border-stone-200 bg-white/95 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => setLogOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-stone-600"
            >
              <span>Execution log ({runLog.length})</span>
              <span>{logOpen ? "▾" : "▸"}</span>
            </button>
            {logOpen && (
              <div className="max-h-56 overflow-auto border-t border-stone-100 px-2 py-1">
                {runLog.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-stone-400">
                    No runs yet — click Run workflow.
                  </p>
                ) : (
                  runLog.map((entry) => (
                    <div key={entry.id} className="border-b border-stone-100 py-1.5 last:border-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLogId(expandedLogId === entry.id ? null : entry.id)
                        }
                        className="flex w-full items-center gap-2 text-left"
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            entry.status === "done"
                              ? "bg-emerald-500"
                              : entry.status === "failed"
                                ? "bg-rose-500"
                                : "bg-stone-400"
                          }`}
                        />
                        <span className="flex-1 truncate text-xs text-stone-700">
                          {entry.status === "done"
                            ? entry.outcome ?? "done"
                            : entry.status === "failed"
                              ? entry.error
                              : "running"}
                        </span>
                        <span className="shrink-0 text-[10px] text-stone-400">
                          {new Date(entry.ts).toLocaleTimeString()}
                        </span>
                      </button>
                      {expandedLogId === entry.id && (
                        <div className="mt-1 space-y-0.5 pl-4 text-[11px] text-stone-500">
                          <div>path: {entry.path.join(" → ")}</div>
                          {entry.trace.map((t) => (
                            <div key={t.nodeId}>
                              {t.prompt} → <b>{t.answer}</b>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>

      {lastAction && (
        <div className="pointer-events-none absolute bottom-12 left-1/2 z-10 -translate-x-1/2 rounded-full bg-stone-900/85 px-3 py-1 text-xs text-stone-100">
          {lastAction}
        </div>
      )}
    </div>
  );
}

export default function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
