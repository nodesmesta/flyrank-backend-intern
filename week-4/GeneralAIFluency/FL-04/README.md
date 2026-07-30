# FL-04 — Weekly Industry Brief Pipeline (Automation Workflow v2)

**Domain:** Asset Management SaaS (Asset Guard)
**Date:** July 30, 2026

---

## Step Diagram

```
Gather (Bright Data MCP) -> Source (NotebookLM) -> Synthesize -> Save -> Review
```

5 steps: **Gather → Source → Synthesize → Save → Review**

---

## Prompts

All prompts and configurations are in [data/prompts.md](data/prompts.md):
- **Prompt 1** — Single-source synthesize (Run 1, 5)
- **Prompt 1b** — Multi-source synthesize (Runs 2-4)

---

## Five Runs

- **Run 1** — Gartner Peer Insights — SAM Tools Reviews 2026. Output: [data/run-1-output.md](data/run-1-output.md)
- **Runs 2-4** — HelloRetriever + InvGate + MSDynamicsWorld. Output: [data/run-2-4-output.md](data/run-2-4-output.md)
- **Run 5** — Strev — Asset Management Pricing Guide 2026. Output: [data/run-5-output.md](data/run-5-output.md)

---

## Time Accounting

- Setup (notebook + prompt): 8 min
- Runs 1-5: 40 min
- Documentation: ~10 min
- **Total pipeline: ~58 min**
- Manual estimate: ~135 min
- **Weekly savings: 57%**

---

## Failure Points

- InvGate HubSpot blog — scrape returned navigation only
- Bright Data batch scrape — 2/3 URLs failed on first attempt
- NotebookLM adds insights beyond source → **must cross-check**
- Content noise (cookie banners, navbar)
- Pricing guide (Run 5) can become stale
- Reddit dynamic content — cannot be scraped
- Search engine relevance not 100%
