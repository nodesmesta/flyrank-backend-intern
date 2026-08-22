# Week 7 · BE-09 — Visual AI Workflow

A **visual AI workflow** tool: every node in the canvas is a **YES/NO AI decision**
(an LLM answers one question with only `YES` or `NO`), and the workflow is
executed by **Inngest** while the flow is built and visualised in **React Flow**.

This is Phase 1 (Setup) of a four-phase build — the scaffolding, wiring and
environment in which the flow editor (Phase 2) and the Inngest-executed AI graph
(Phase 3) will live.

## Phase status

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Setup — app, React Flow, Inngest, OpenAI SDK, Shadcn, env, structure | ✅ done |
| 2 | Foundations — visual flow editor, YES/NO edge types, editable prompts | ✅ **done (this commit)** |
| 3 | Build — every node → Inngest step, LLM returns YES/NO, dynamic traversal | ⏳ next |
| 4 | Polish — ≥3 of: execution state, logs panel, save/load, export/import, styling, retries | ⏳ todo |

## Summary

- **Two parts, one repo**: a Next.js site (`site/`) renders the React Flow canvas;
  an Express + Inngest server (`src/`) is the workflow engine and exposes
  `/api/inngest` for the Dev Server to discover and run functions. Both share the
  repo-root dependencies (single hoisted install — the monorepo convention).
- **React Flow wired**: the canvas already renders a running two-branch graph —
  `Request arrives → "Is this a support request?"` with a **YES** edge to
  `Support queue` and a **NO** edge to `Sales queue`, the exact example shape the
  assignment describes.
- **Inngest alive**: the Dev Server discovers and runs an `engine-ping` function
  (event `workflow/ping` → `pong from the AI workflow engine`), proving the
  app ↔ Dev Server loop before any workflow logic exists.
- **Shadcn (light)**: Tailwind v4 + the `cn` helper + `Button` / `Card` UI
  primitives, so the UI is consistent without the full shadcn CLI.
- **LLM provider configured**: `openai` SDK + OpenCode Zen free tier (the lane
  already proven in this repo at week-6) — three env vars ready for Phase 3.
- **Interactive editor (Phase 2)**: add nodes from a palette, drag between
  handles to connect (a decision forks into YES / NO), click a prompt to edit it
  inline, arrange nodes freely, and delete with Del — the whole graph is
  persisted to `localStorage` and restored on reload.

## The flow editor (Phase 2)

The canvas is now a working editor, not a static picture:

- **Add nodes** from the panel — `Start`, `AI decision` (the YES/NO question),
  and `Outcome`.
- **Connect nodes** by dragging from a source dot to a target dot. A decision
  node exposes **two** source handles (`YES` and `NO`), so the branch you draw is
  encoded straight into the edge; the start node has one neutral output.
- **YES / NO edge types** — three custom edge components (`yesedge` emerald,
  `noedge` rose, `flowedge` stone) render the smooth-step path, an arrowhead and
  a `YES` / `NO` badge, and each edge stores `data.branch` (`yes` / `no` /
  `next`) — the exact field Phase 3's executor will read.
- **Edit node prompts** inline — click any prompt or label, type, Enter commits
  (Escape cancels). `updateNodeData` keeps the graph state controlled.
- **Store graph state locally** — every edit writes `{nodes, edges}` to
  `localStorage` (`be9:workflow:v1`); on load the editor restores what you
  saved, or falls back to the two-branch example.

Verified against the running dev server (Playwright drives the real UI):

```
initial graph                     4 nodes, 3 edges (YES + NO example)
click "+ AI decision", "+ Outcome" → 6 nodes
drag the decision's YES handle onto an Outcome node → 4 edges (3 → 4)
click a prompt, type, Enter  →  localStorage gains "Is this a billing issue?"
reload ↓                        edited graph restored (6 nodes, 4 edges)
console                         0 errors
```

## Run it

From the repo root (monorepo scripts follow the `:be9` convention):

Terminal 1 — the API + Inngest function host (listens on port 3000):

```bash
npm run start:be9        # one-shot
npm run dev:be9          # watch mode
```

Terminal 2 — the Inngest Dev Server + dashboard:

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
# dashboard at http://localhost:8288
```

Terminal 3 — the frontend (React Flow editor, port 3001):

```bash
npm run dev:be9-site     # http://localhost:3001
npm run build:be9-site   # production build of the site
```

Proving the loop by hand — send `workflow/ping` and watch `engine-ping` run:

```bash
npm run start:be9
# (in another terminal) send the event, then check the dashboard run stream
INNGEST_DEV=1 npx tsx week-7/BE-09/src/test-ping.ts
```

Environment lives in `week-7/BE-09/.env` (copy `.env.example`), loaded explicitly
by `src/config.ts`. The LLM variables (`LLM_BASE_URL`, `LLM_API_KEY`,
`LLM_MODEL`) are consumed in Phase 3; the free tier needs an **empty** key (only
a non-empty key is signed onto the Authorization header).

## Endpoints

| Method | Path | Description | Status |
|--------|------|-------------|--------|
| GET | `/health` | Liveness probe | `200` |
| POST | `/api/inngest` | Inngest function discovery + execution (Dev Server) | — |

The discovery/execution surface grows in Phase 3 with the graph-execution routes.

## Verified live

```
GET /health                                HTTP 200  {"status":"ok"}
workflow/ping event sent                   id 01M0M6XSZ1YV4XQA1E5HPJRSFY
Dev Server: initializing fn engine-ping -> inngest/function.finished  (run completed)
site renders: 1 React Flow container, decision node rendered,
              header + YES/NO graph present (Playwright DOM check)
next build week-7/BE-09/site               Compiled + TypeScript passed (exit 0)
```

The two evidence captures — the Phase 1 health check and the Phase 2 interactive editor in use:

<div align="center" style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">
  <figure style="flex:1 1 46%; min-width:300px; margin:0;">
    <img src="data/evidence/site-phase1.png" alt="BE-09 site — Phase 1" width="100%"/>
    <figcaption style="text-align:center; font-size:12px; opacity:.8;">
      Phase 1: header, stack badges, disabled Run button, and the two-branch
      YES/NO graph on the React Flow canvas
    </figcaption>
  </figure>
  <figure style="flex:1 1 46%; min-width:300px; margin:0;">
    <img src="data/evidence/editor-phase2.png" alt="BE-09 editor — Phase 2" width="100%"/>
    <figcaption style="text-align:center; font-size:12px; opacity:.8;">
      Phase 2: the interactive editor — node palette (top-left), an added
      decision + outcome node, a freshly connected YES edge, and the edited
      prompt persisted to localStorage
    </figcaption>
  </figure>
</div>

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router, `next dev`) + React + React Flow (`@xyflow/react`) |
| UI primitives | Shadcn-style: Tailwind v4, `cn` helper, `Button` / `Card` |
| Workflow engine | Inngest SDK + local Dev Server (dashboard :8288) |
| Web framework | Express (API + `serve` for `/api/inngest`) |
| LLM | `openai` SDK + OpenCode Zen free tier (Phase 3) |

## Project structure

```
week-7/BE-09/
├── README.md
├── task.md
├── .env.example            committed template; .env is git-ignored
├── src/                    the workflow engine (Express + Inngest)
│   ├── config.ts           dotenv loader (explicit path) + port
│   ├── server.ts           /health + /api/inngest (serve) + /api/inngest
│   ├── functions.ts        Inngest client + engine-ping (Phase-3 executor lands here)
│   └── test-ping.ts        Phase-1 checkpoint: sends workflow/ping
├── site/                   the Next.js frontend (React Flow editor)
│   ├── tsconfig.json / next.config.ts / postcss.config.mjs / next-env.d.ts
│   └── src/
│       ├── app/            layout.tsx, page.tsx, globals.css (Tailwind + React Flow)
│       ├── components/
│       │   ├── flow/
│       │   │   ├── FlowCanvas.tsx     controlled editor (add/connect/delete/persist)
│       │   │   ├── nodes.tsx          Start / AI-decision / Outcome (+ editable prompt)
│       │   │   ├── edges.tsx          YES / NO / flow custom edge types
│       │   │   └── types.ts           AppNode/AppEdge types, palette, branch mapping
│       │   └── ui/                     button.tsx, card.tsx (shadcn-light)
│       └── lib/utils.ts                cn() helper
└── data/evidence/          site-phase1.png, editor-phase2.png
```

## Conclusion

Phase 1 proved the three moving parts of an AI workflow product talk to each
other on this machine — the Next.js site renders the brief's own two-branch
graph, and the Inngest Dev Server completes a real run over `/api/inngest`. Phase
2 turns that static canvas into the actual thing a workflow operator uses: nodes
come from a palette, connections are drawn handle-to-handle with the YES/NO
branch baked into the edge (and stored as `data.branch` for the executor), prompts
are edited in place, and the whole graph survives a reload in `localStorage`.
The graph is no longer a data structure I type out — it is a shape the user builds.

Two things carry forward into Phase 3. First, the graph is now a clean serializable
contract — an array of `{kind, prompt}` nodes and `{source, target, branch}` edges —
which is exactly the payload the Inngest executor will consume. Second, the
Inngest v4 wiring settled in BE-06 (trigger in the options object, `express.json()`
before the `serve` adapter, `INNGEST_DEV=1`) means Phase 3's executor is a matter
of walking that graph with `step.run(...)` per node and following the LLM's `YES`
or `NO` along `data.branch` — the loop is already warm.

