# ChooseYourStackwithAI — AI Prompts

Date: August 6, 2026
Context: Stack decision for the Asset Guard portfolio (7-page SaaS site) with a live demo requirement.
AI used: Hermes Agent (this workspace) — ran the prompt below as the "AI adviser".

---

## Prompt 1 — Get three stack options

```text
Help me choose a stack for my portfolio. Do not pick for me, give me options
with real trade-offs.

My constraints:
- Free tools only.
- My honest skill level: I learned HTML and CSS in 2014 (solid basics, but
  long unused). Today I am a backend developer intern — comfortable with
  TypeScript, Express, Node, Supabase, and SQLite. I am NOT comfortable with
  frontend frameworks (React, Next.js, etc.) yet.
- What the portfolio needs to do (sitemap + content map): a 7-page SaaS
  portfolio site for "Asset Guard" (a tool that detects stuck assets and
  gives every asset a productivity score and next steps). Pages: Hero,
  Features, Orchestration, Pricing, Consumer Say, CTA, Footer. Each case
  study (my backend engineering tasks) must link to its GitHub repository
  and be readable as long-form technical writing.
- How my work must be shown: code repositories (GitHub links) and long-form
  technical case studies. No heavy image galleries, no embedded media.
- Dynamic at launch: YES — visitors must be able to try a LIVE DEMO on the
  page (upload an asset document and see it scored), so a backend and a
  database must actually run somewhere, free.

Give me three stack options, simplest to most powerful, each with: how I
would build it, where I would host it for free, whether it needs a backend,
how well it shows my kind of work, and the real trade-off.

End with the one you would pick for me and why. Then I will decide.
```

## Output — Three stack options

Saved in [options.md](options.md) once the decision round is complete.
