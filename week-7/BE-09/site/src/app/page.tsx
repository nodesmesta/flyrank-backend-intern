import FlowCanvas from "@/components/flow/FlowCanvas";

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold text-stone-900">AI Workflow</h1>
          <span className="text-sm text-stone-500">
            each node is a YES/NO decision, executed by Inngest
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
            React Flow
          </span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
            Inngest
          </span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
            OpenCode Zen
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <FlowCanvas />
      </main>
    </div>
  );
}
