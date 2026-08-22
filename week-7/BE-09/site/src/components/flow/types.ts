import type { Edge, Node } from "@xyflow/react";

/** Data carried by each node. A decision node holds the prompt sent to the LLM;
 * start/end hold a display label. */
export type AppNodeData =
  | { kind: "start"; label: string }
  | { kind: "decision"; prompt: string }
  | { kind: "end"; label: string };

export type AppNode = Node<AppNodeData, "start" | "decision" | "end">;

/** An edge records the branch it came out of (yes / no / next). Phase 3 walks
 * these to follow the LLM's answer. */
export type Branch = "yes" | "no" | "next";
export type AppEdge = Edge<{ branch: Branch }>;

export const STORAGE_KEY = "be9:workflow:v1";

export const PALETTE: { kind: AppNodeData["kind"]; label: string; defaultData: AppNodeData }[] = [
  { kind: "start", label: "Start", defaultData: { kind: "start", label: "Request arrives" } },
  { kind: "decision", label: "AI decision", defaultData: { kind: "decision", prompt: "Is this a support request?" } },
  { kind: "end", label: "Outcome", defaultData: { kind: "end", label: "Done" } },
];

/** The React Flow edge type + label for a branch leaving a node. */
export function branchShape(branch: Branch): { edgeType: string; label: string } {
  if (branch === "yes") return { edgeType: "yesedge", label: "YES" };
  if (branch === "no") return { edgeType: "noedge", label: "NO" };
  return { edgeType: "flowedge", label: "→" };
}
