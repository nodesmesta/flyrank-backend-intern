"use client";

import { memo, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import type { AppNode, AppNodeData } from "./types";

function EditableText({
  id,
  field,
  value,
  placeholder,
  multiline,
}: {
  id: string;
  field: "prompt" | "label";
  value: string;
  placeholder: string;
  multiline?: boolean;
}) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    updateNodeData(id, { [field]: next } as Partial<AppNodeData>);
    setDraft(next);
  };

  if (editing) {
    const base =
      multiline
        ? "w-full resize-none rounded border border-stone-400 bg-white px-1.5 py-1 text-sm font-medium outline-none"
        : "w-full rounded border border-stone-400 bg-white px-1.5 text-sm font-medium outline-none";
    return (
      <textarea
        className={base}
        value={draft}
        autoFocus
        rows={multiline ? 2 : 1}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") setEditing(false);
        }}
        onFocus={(e) => e.target.select()}
      />
    );
  }

  return (
    <p
      className="cursor-text text-sm font-medium text-stone-800"
      title="Click to edit"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      {value.trim() ? value : <span className="text-stone-400 italic">{placeholder}</span>}
    </p>
  );
}

/** A node that asks a YES/NO question to the LLM. Prompt is editable inline. */
export const DecisionNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
  const d = data as Extract<AppNodeData, { kind: "decision" }>;
  return (
    <div
      className={`w-60 rounded-lg border bg-white px-3 py-2 shadow-sm ${
        selected ? "border-stone-500 ring-1 ring-stone-300" : "border-stone-300"
      }`}
    >
      <span className="inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
        AI decision
      </span>
      <div className="mt-1">
        <EditableText id={id} field="prompt" value={d.prompt} placeholder="Type a question…" multiline />
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} id="yes" />
      <Handle type="source" position={Position.Bottom} id="no" />
    </div>
  );
});

/** Entry point with a single output. */
export const StartNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
  const d = data as Extract<AppNodeData, { kind: "start" }>;
  return (
    <div
      className={`rounded-full border-2 bg-stone-100 px-4 py-2 ${
        selected ? "border-stone-600 ring-1 ring-stone-300" : "border-stone-400"
      }`}
    >
      <div className="min-w-[80px] text-center">
        <EditableText id={id} field="label" value={d.label} placeholder="Start" />
      </div>
      <Handle type="source" position={Position.Right} id="next" />
    </div>
  );
});

/** Exit point with a single input. */
export const EndNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
  const d = data as Extract<AppNodeData, { kind: "end" }>;
  return (
    <div
      className={`rounded-full border-2 bg-stone-50 px-4 py-2 ${
        selected ? "border-stone-600 ring-1 ring-stone-300" : "border-stone-300"
      }`}
    >
      <div className="min-w-[80px] text-center">
        <EditableText id={id} field="label" value={d.label} placeholder="Done" />
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
});
