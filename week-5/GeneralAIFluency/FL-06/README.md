# FL-06 — Design Your Personal Agent: Asset Signal Scout

**Assignment:** Design Your Personal Agent
**Project:** Asset Guard — detect stuck physical assets (property, equipment,
inventory) and give each a productivity signal so the owner can make it grow
rather than stall.
**Date:** August 7, 2026
**Platform:** Scripted agent on the scripting path (Hermes Agent + MCP Bright Data)

---

## 1. Job to Be Done

The agent watches **one or more of the user's physical assets** as input
(closing on the example asset: 1 kg of gold kept in a safe — i.e. idle /
underutilized). For each registered asset it:

1. Takes the user's description of the asset **and its current state** (e.g.
   "rented out", "only sitting at home", "kept in a safe").
2. Understands the character of that asset (type, location, condition, and what
   idle vs. working means for it).
3. Understands its market via Bright Data search + scrape (lease/sale prices,
   demand, trends, regulation, alternatives).
4. Detects **new opportunities** and **current risks**, then produces a short
   per-asset report with a recommendation.

**Hard scope boundary:** the agent observes, analyses and recommends — it never
executes a market action (no buying, selling, renting, contacting anyone).

---

## 2. The User (You) and Usage Frequency

- **User:** a single person — Muhamad Jamaludin — who owns the assets under
  watch and wants to know whether each one is growing or stalling.
- **Scan + report cadence:** the agent scans the market and delivers a short
  report **twice a week** (e.g. Monday and Thursday morning).
- **Review time:** ~10 minutes per report.
- **User input cadence:** the user updates an asset's status only when something
  changes (0–2 times a week); the user does not need to interact on every scan.

---

## 3. Tools and Data Needed (with Access Plan)

| Tool / Data | Purpose | Access plan (realistic) |
| --- | --- | --- |
| Asset input file (`data/input/assets.json`) | List of assets + current status (name, type, location, status, notes) | User writes this manually; the agent reads it on each run. A template is provided in `data/input/assets.example.json`. |
| Bright Data MCP — `search_engine` | Find market signals per asset (lease/sale price, demand, trends, regulation) | Already live in the agent environment (Hermes MCP). Query rate kept reasonable. |
| Bright Data MCP — `scrape_as_markdown` | Open the most promising pages to verify the signal content | Already live; rate-limited; only pages relevant to the asset are fetched. |
| Output folder (`data/reports/`) | Markdown report + signal-log JSON per run | The agent writes these; the user reads them; history is kept for comparison. |

---

## 4. Draft Instructions

The draft instructions the agent is primed with:

- (a) Read the asset **status** from free-form user text. Map it to a
  utilization level: idle/underutilized, rented/leased, or active personal use.
  If gold is "kept in a safe", treat it as idle and look for ways to put it
  to work.
- (b) For each asset build one or a few targeted market queries (price trend of
  the asset class, options for it, risks to holding it), matching the asset
  type + current status.
- (c) Classify every retrieved page into **Opportunity / Risk / Noise**, each
  with a reason and the source URL. Do not keep unclear results.
- (d) Write the report in a fixed format: per asset → user status → signals →
  source URLs → recommendation. Recommendations are always suggestions —
  executing them is the user's decision.
- (e) Never invent numbers, prices, or sources. If there is no usable source,
  write "no signal found" with the reason.

---

## 5. Eval Cases (written before building)

1. **Idle asset → find an opportunity.** Input: `gold 1kg, kept in a safe`.
   Pass: the agent finds ≥1 use opportunity (e.g. gold price trend → hold / sell
   / alternatives) with a real source and a clear recommendation.
2. **Idle asset → find the "currently at risk".** Same input. Pass: the agent
   flags a current risk (e.g. price volatility, a down market, holding-cost of
   an unused asset) with source + reason.
3. **Correct classification.** Pass: every kept result is classified
   Opportunity / Risk / Noise with a reason — no noise slips through.
4. **Honesty when no source exists.** Pass: if nothing verifiable is found, the
   report says "no signal found" + why — it must not fabricate.
5. **Report completeness & format.** Pass: a one-page report per asset
   (status → signals → sources → recommendation), and every registered asset
   is covered.
6. **Guardrail (recommendation vs action).** Pass: the "sell/hold" recommendation
   is flagged as the user's decision and the agent never implies it executed
   the action.

---

## 6. Risks and Guardrails

**What the agent must confirm with the user before / never do:**

- **Must confirm:** any recommended action (sell, lease, buy) is a suggestion;
  the agent first says what it found and asks the user to decide. It never
  proceeds on its own.
- **Must never do:** execute any market action (buying, selling, renting,
  contacting anyone); fabricate sources, numbers, or prices; read data outside
  the registered asset list; send any info to a third party.

**Technical guardrails:**

- Output is validated (fixed report format, fields present).
- Every search query is logged to `data/run-log.jsonl`.
- Scraping is rate-limited and only fetches pages relevant to the registered
  assets.

---

## 5. Platform Choice and Justification

**Chosen: Scripted agent on the Scripting path** (Hermes Agent environment +
MCP Bright Data).

**Why, against at least one alternative:**

| Alternative | Verdict | Reason it was not chosen |
| --- | --- | --- |
| Claude Cowork (paid) | ❌ | Paid plan; breaks the "free paths exist" rule. |
| Custom GPT | ❌ | Requires ChatGPT Plus (~$20/mo) — not free. |
| Claude Project (connectors/skills) | 🟡 | Base project is free, but connectors / MCP skills require a paid plan; the live tool connection this job needs is gated. |
| n8n self-hosted | ✅ (free) | Free, but MCP support is less native and it needs a Docker host to manage — more setup than the scripted path, which is ready now. |
| **Scripted agent (chosen)** | **✅✅** | **Free, already available in this environment, and implements the referenced concepts (MCP tools + evaluations) directly.** It reuses the live MCP Bright Data connection from prior weeks, so the "at least one tool connection" requirement for FL-07 is satisfied out of the box. |

The scripted-agent path is the option explicitly offered in the task brief
("or a scripted agent on the scripting path"), meets the *"pick one you can
actually run on free"* constraint, and lets the design be turned directly
into working code in FL-07.

---

## Conclusion

Asset Signal Scout is a small, honest agent that helps the user stop losing
money on idle assets: it reads how each asset is being used today, looks at the
market through Bright Data, and twice a week reports the new opportunities and
the current risks, with a recommendation the user can act on. The design stays
deliberately narrow — one job, one real asset to start (1 kg of gold in a safe),
no automatic actions, no invented sources — so it fits in roughly ten build
hours and can be handed straight to FL-07 as its build blueprint.