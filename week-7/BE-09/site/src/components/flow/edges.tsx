"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

/** Shared renderer for the three branch edges. Color + the YES/NO/→ badge
 * come from `tone`; `branch` labels the edge so Phase 3 can read it. */
function BranchEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  tone,
  label,
  labelBg,
}: EdgeProps & { tone: string; label: string; labelBg: string }) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{ stroke: style?.stroke ?? tone, strokeWidth: style?.strokeWidth ?? 2 }}
      />
      <EdgeLabelRenderer>
        <span
          className="nodrag nopan absolute pointer-events-none select-none rounded px-1.5 py-0.5 text-[11px] font-bold"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            color: tone,
            background: labelBg,
            border: `1px solid ${tone}`,
          }}
        >
          {label}
        </span>
      </EdgeLabelRenderer>
    </>
  );
}

export function YesEdge(props: EdgeProps) {
  return (
    <BranchEdge
      {...props}
      tone="#059669"
      labelBg="#ecfdf5"
      label={props.data?.label?.toString() ?? "YES"}
    />
  );
}

export function NoEdge(props: EdgeProps) {
  return (
    <BranchEdge
      {...props}
      tone="#e11d48"
      labelBg="#fff1f2"
      label={props.data?.label?.toString() ?? "NO"}
    />
  );
}

export function FlowEdge(props: EdgeProps) {
  return (
    <BranchEdge
      {...props}
      tone="#78716c"
      labelBg="#fafaf9"
      label={props.data?.label?.toString() ?? "→"}
    />
  );
}
