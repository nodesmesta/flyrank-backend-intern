"use client";

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";

type DecisionNodeData = { prompt: string };
type TerminalNodeData = { label: string; tone: "start" | "yes" | "no" };

/** A node that asks a YES/NO question to an LLM. */
function DecisionNode({ data }: NodeProps) {
  const { prompt } = data as DecisionNodeData;
  return (
    <div className="w-56 rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-sm">
      <span className="inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
        AI decision
      </span>
      <p className="mt-1 text-sm font-medium text-stone-800">{prompt}</p>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} id="yes" />
      <Handle type="source" position={Position.Bottom} id="no" />
    </div>
  );
}

/** A terminal box (start / outcome). */
function TerminalNode({ data }: NodeProps) {
  const { label, tone } = data as TerminalNodeData;
  const toneClasses =
    tone === "start"
      ? "border-stone-400 bg-stone-100 text-stone-700"
      : tone === "yes"
        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
        : "border-rose-400 bg-rose-50 text-rose-700";
  return (
    <div className={`rounded-full border-2 px-4 py-2 text-sm font-semibold ${toneClasses}`}>
      {label}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} id="next" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  decision: DecisionNode,
  terminal: TerminalNode,
};

const initialNodes: Node[] = [
  {
    id: "start",
    type: "terminal",
    position: { x: 0, y: 130 },
    data: { label: "Request arrives", tone: "start" },
  },
  {
    id: "gate",
    type: "decision",
    position: { x: 260, y: 110 },
    data: { prompt: "Is this a support request?" },
  },
  {
    id: "support",
    type: "terminal",
    position: { x: 600, y: 20 },
    data: { label: "Support queue", tone: "yes" },
  },
  {
    id: "sales",
    type: "terminal",
    position: { x: 600, y: 200 },
    data: { label: "Sales queue", tone: "no" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e0",
    source: "start",
    target: "gate",
    animated: true,
    style: { stroke: "#78716c" },
  },
  {
    id: "e-yes",
    source: "gate",
    target: "support",
    sourceHandle: "yes",
    type: "smoothstep",
    label: "YES",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#059669" },
    style: { stroke: "#059669", strokeWidth: 2 },
  },
  {
    id: "e-no",
    source: "gate",
    target: "sales",
    sourceHandle: "no",
    type: "smoothstep",
    label: "NO",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#e11d48" },
    style: { stroke: "#e11d48", strokeWidth: 2 },
  },
];

export default function FlowCanvas() {
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#e7e5e4" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
