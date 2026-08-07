# FL-06 — Draft Prompts & Data Templates

These are the **design-time** prompts and input templates referenced by the spec.
They are the blueprint the agent executes in FL-07; nothing here has been run yet.

---

## A. Asset Input Template (`data/input/assets.example.json`)

The user describes each asset + its current status. The agent reads this file
on every run.

```json
{
  "version": 1,
  "assets": [
    {
      "name": "Gold 1kg",
      "type": "precious-metal",
      "location": "home safe (brankas)",
      "status": "idle",
      "status_notes": "Kept in a safe, not rented / not used / not earning.",
      "registered_on": "2026-08-07"
    }
  ]
}
```

User copies `assets.example.json` → `assets.json` and fills it in.

---

## B. Run config

The agent reads these settings on each run (env / config file).

```json
{
  "cadence": "2x per week",
  "scan_days": ["Monday", "Thursday"],
  "input_file": "data/input/assets.json",
  "output_dir": "data/reports",
  "log_file": "data/run-log.jsonl",
  "rating_limit_ms": 1500,
  "language": "en"
}
```

---

## C. Draft system prompt (primed as step 4 of the spec)

```
You are Asset Signal Scout for Asset Guard. Your only job: for each registered
asset, look at its current status, understand its market, and report new
opportunities and current risks with a recommendation. You never take a market
action — you answer and the user decides.

Rules:
- Map the asset status to a utilization level (idle / underutilized, leased,
  active personal use). Treat "kept in a safe" as idle.
- Search the market with Bright Data; for each asset run 1-3 targeted queries
  that match the asset type + status.
- Classify each retrieved page as one of: Opportunity, Risk, or Noise. Keep a
  reason and the URL for everything you keep. Discard noise.
- If nothing verifiable is available, write "no signal found" plus the reason.
  Never invent prices, trends, or sources.
- Output a fixed report per asset: status -> signals -> source URLs ->
  recommendation. Recommendation is a suggestion, never an executed action.
```

---

## D. Session prompt (user runs the agent)

```
Scan the asset list in data/input/assets.json and write today's report to
data/reports/report-<YYYY-MM-DD>.md following the spec format. Log every query
to data/run-log.jsonl.
```