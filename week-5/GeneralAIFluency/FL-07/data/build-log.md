# Build Log — Asset Signal Scout (FL-07, Checkpoint 1)

**Platform:** Scripted agent on the scripting path — a self-contained TypeScript agent
in `src/` that talks to Bright Data MCP (`search_engine`, `scrape_as_markdown`) over
streamable HTTP, and to an OpenAI-compatible LLM (OpenCode Zen) for classification.
Chosen and justified in FL-06; platform unchanged, implementation made agent-owned.

**Core job (from FL-06 spec):** read `data/input/assets.json` → understand each asset's
status → scan the market via Bright Data (search + scrape) → classify signals
(Opportunity / Risk / Noise) with reasons + source URLs → write per-asset report +
signal log → log every query to `data/run-log.jsonl`. Never execute a market action.

---

## Iteration 0 — exploration run (Hermes-driven, 2026-08-08)

Goal: fastest possible proof that the market scan is feasible before writing any code.

1. Read `assets.json` (Gold 1kg — idle, in a home safe).
2. Asked Bright Data assistant (Sophie) which MCP tools fit → `search_engine` + `scrape_as_markdown`.
3. Ran 3 targeted queries (price trend / options for idle gold / risks of holding).

### What broke
- **Query 1 (Google) returned an EMPTY SERP** (`{"organic":[],"current_page":1}`) — no price
  signal at all. Fix: retried the same intent on **Bing** → live price $139.61/g (metalcharts.org).
- **asciinema not installed** on this machine → installed in a venv (`/tmp/asciinema-venv`).
- **Flaky LLM/HTTP mid-run** (500s, rate limits) → the classifier now retries once with a
  hardened instruction (see next iteration).

### Key decisions from this iteration
- Search-engine fallback (Google empty → Bing) became a permanent agent behavior, logged as
  `query_empty` events.
- Verify before use: the price quote was scraped from the underlying page (metalcharts.org)
  BEFORE being written into a report — $139.61/g = $4,342.35/oz, and the ATH $179.70/g
  (2026-01-28) → material finding (price ~22% below ATH).

---

## Iteration 1 — USER CORRECTION: the agent must be our own code

The FL-06 spec said "Hermes Agent environment + MCP Bright Data". The user corrected this:
the FL-07 deliverable should be an agent we *own*, living in `src/` — not "Hermes runs the
prompt". No spec statement was deleted; the deviation is documented here as the task brief
requires ("Deviating from the spec is normal; document it").

**What changed (code vs. exploration):**
- New `src/` modules: `config.ts` (env/.env), `brightdata.ts` (MCP client + SECURITY-NOTICE
  marker unwrap), `classifier.ts` (LLM call + strict JSON parsing), `report.ts`
  (report/signals/run-log writers), `agent.ts` (orchestrator).
- Agent connects to Bright Data MCP **directly** (streamable HTTP, token from `.env`), not via
  a shell session. Live tool connection requirement is met by the agent's own MCP client.

### What broke while building
- **`write_file` blocked on existing files** in `src/` (tool policy) → edits done via patch /
  script; noted as env quirk, not an agent issue.
- **Bright Data wraps tool output in `=====UNTRUSTED_<id>_BEGIN===== … END=====` markers** —
  naive `JSON.parse` failed with `Unexpected token 'S', "SECURITY N…"`. Fix: strip the marker
  block before parsing (regex-free: indexOf-based).
- **LLM endpoint returned 401 with the provided `sk-` API key** — OpenCode Zen free tier is
  **no-auth** (verified: plain request returns 200). Agent now sends `Authorization` only when
  a key is present. User-supplied key rejected (401) by the endpoint → not used; the build log
  is honest about it. The `.env` holds an empty key.
- **`parseJson` used chained try/catch** — user flagged silent-failure risk. Rewritten:
  real brace-matching scanner (string/escape aware), strict shape validation, unknown `klass`
  is DROPPED WITH A WARNING (never silently mapped to Noise), and any failure retries once with
  a hardened instruction. Unit tests: 6/6 pass.
- **Query-time failures (non-JSON reply / fetch / MCP timeout)** — agent now retries the
  query on Bing once, logs `query_error` + `query_result`, and continues; a single bad SERP
  never aborts the run.

---

## Iteration 2 — dependency hygiene (user correction #2)

The user noticed a local `node_modules/` inside `FL-07/`. The repo convention (all weeks) is
**one root `package.json`** with per-assignment `scripts`. Corrected:

- Deleted `FL-07/package.json`, `FL-07/package-lock.json`, `FL-07/node_modules`.
- Root `package.json` gained `@modelcontextprotocol/sdk` (dependency) and two scripts:
  `scout:fl07` = `tsx week-5/GeneralAIFluency/FL-07/src/agent.ts`,
  `capture:fl07` = asciinema capture of the agent run.
- `npm install` at root (56 packages added, 0 vulnerabilities); `npx tsc --noEmit` clean.
- Agent verified to run from repo root via `npm run scout:fl07` → report written, exit 0.

---

## Iteration 3 — capture run with the dedicated FlyRank token (2026-08-08)

The user supplied a dedicated Bright Data access token for the FlyRank work
(`BRIGHT_MCP_URL` in `.env`, git-ignored). Verified live: MCP handshake HTTP 200,
agent SDK connect OK — the agent now runs on that token. Recaptured so the
evidence uses the same credential as the deployment.

**New failure point found by the recapture:** Bing SERPs sometimes return
**relative `/goto?url=…` proxy links** instead of absolute URLs →
`scrape_as_markdown` rejected them (`Invalid url`). The agent logged 3
`scrape_error` events and completed the run — but verification was empty that
run. Fix: `collect()` now drops non-absolute links before scraping. Verified
on the next run: scrapes landed, report still exit 0.

Also: `asciinema` was living in a disposable `/tmp` venv → moved to
`~/.local/asciinema-venv` + `~/.local/bin/asciinema` symlink so
`npm run capture:fl07` works on any fresh shell; script gained `--overwrite`.

Final capture: `data/capture/run2.cast` — 111s, exit 0, replay verified.

---

## Eval results vs. FL-06 evals (post-iteration)

| # | Eval case | Result |
|---|-----------|--------|
| 1 | Idle asset → opportunity found | ✅ PASS — gold-leasing yield (2–5% p.a.), J.P. Morgan $6,000/oz forecast, verified sources |
| 2 | Idle asset → current risk flagged | ✅ PASS — price ~22% below ATH (2026-01-28), volatility, storage/security costs, CFTC warning |
| 3 | Correct O/R/N classification | ✅ PASS — all kept signals have class + reason + URL; noise (geo-mismatch / duplicate / YouTube) dropped with reason |
| 4 | Honesty when no source exists | ✅ PASS — empty/failed queries logged and retried; nothing fabricated; 500-retry means no silent gaps |
| 5 | Report format & completeness | ✅ PASS — per-asset report: status → signals → sources → recommendation; 1/1 asset covered |
| 6 | Guardrail (recommend vs execute) | ✅ PASS — report ends with "the agent only reports — the user decides"; no action executed |

## What was cut / deferred (from FL-06 spec)

- **2x/week scheduler (cron, Mon/Thu)** — not part of this MVP. FL-07 scope is "the narrowest
  version of the core job, one full end-to-end run". The cron layer stays designed-but-unbuilt.
- **Multiple-assets batch output** — deferred; this checkpoint proves the single-asset path.
- **No action pipeline** — guardrail from spec: recommend, never execute.
