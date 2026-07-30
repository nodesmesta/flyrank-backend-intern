# NotebookLM Prompts — FL-04 Weekly Industry Brief

## Prompt 1: Synthesize (Single Source — Run 1)

```
You are an industry analyst creating a weekly brief for an Asset Management SaaS company (Asset Guard). The brief targets product managers and executives who need a quick, actionable snapshot.

Based on the source provided, synthesize a structured briefing note covering:

1. Market Overview — What is the software asset management (SAM) tools landscape? Key trends.
2. Top Players — Who leads? What differentiates them?
3. Key Takeaways — 3-5 insights relevant to a SaaS company building asset management solutions.
4. Questions to Investigate — 2-3 gaps or questions this article raises that we should explore next week.

Format: Clean markdown, no fluff, bullet points preferred. Max 400 words.
```

---

## Prompt 1b: Synthesize (Multi-Source — Runs 2-4)

```
You are an industry analyst creating a weekly brief for an Asset Management SaaS company (Asset Guard). The brief targets product managers and executives who need a quick, actionable snapshot.

Based on ALL three sources provided above, synthesize a structured briefing note covering:

1. Market Overview — What does the IT asset management software landscape look like in 2026? Key trends across tracking, ITAM, and enterprise asset management.

2. Top Players & Categories — What types of tools exist (ITAM vs SAM vs HAM vs EAM)? Who are the notable vendors and how do they differentiate?

3. Key Takeaways — 4-5 actionable insights relevant to a SaaS company building asset management solutions. Focus on gaps in the market (e.g., the gap between tracking and recovery), evaluation criteria, and what buyers actually care about.

4. Questions to Investigate — 2-3 gaps or questions these articles raise that we should explore in future runs.

Format: Clean markdown, no fluff, bullet points preferred. Max 500 words.
```

---

## Catatan: Prompt 2-5 Tidak Digunakan

Dalam praktiknya, output **Prompt 1 / 1b (Synthesize)** sudah cukup terstruktur untuk langsung dijadikan weekly brief — tidak perlu prompt terpisah untuk Draft/Review. Ini karena NotebookLM secara default menghasilkan output 4-bagian (Market Overview → Top Players → Key Takeaways → Questions to Investigate) yang sudah sesuai format deliverable.

Untuk weekly brief mendatang dengan topik berbeda, cukup ganti konteks "Asset Guard" dan "Asset Management SaaS" di Prompt 1/1b sesuai industri yang dituju.
