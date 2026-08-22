"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const saved = useMemo(loadState, []);
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(saved?.nodes ?? defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(saved?.edges ?? defaultEdges);
  const [lastAction, setLastAction] = useState<string | null>(null);

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

  return (
    <div className="h-full w-full">
      <ReactFlow<AppNode, AppEdge>
        nodes={nodes}
        edges={edges}
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
          </div>
        </Panel>

        <Panel position="bottom-center">
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs text-stone-500 shadow-sm backdrop-blur">
            Drag to arrange · drag a dot to connect (a decision forks into YES / NO) · click a
            prompt to edit · select + Del to remove
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
