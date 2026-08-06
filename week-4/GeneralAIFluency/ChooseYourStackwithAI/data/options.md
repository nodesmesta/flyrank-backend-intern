# ChooseYourStackwithAI — Options Output

Date: August 6, 2026
AI: Hermes Agent — ran Prompt 1 from [prompts.md](prompts.md) with the user's
real constraints. Options and trade-offs are the AI's; the decision is the
user's.

---

## Option 1 — Simplest: Static HTML/CSS portfolio + separate Express demo

- **How I would build it:** portfolio = plain HTML + CSS, 7 pages taken
  straight from the content map (Hero, Features, Orchestration, Pricing,
  Consumer Say, CTA, Footer). Demo = a small Express API; database = Supabase
  Postgres (SQLite does not persist on Vercel's serverless disk, so Supabase
  replaces it).
- **Where I would host it (free):** portfolio and demo both on Vercel free;
  Supabase free tier for Postgres + file storage.
- **Needs a backend?** Yes — but only for the demo, as a separate
  service/function. The portfolio itself is 100% static.
- **How well it shows my kind of work:** very well — case studies read as
  clean long-form, each one links to its GitHub repo, and the "Test the live
  prototype" button reaches a real running demo.
- **The real trade-off:** nothing new to learn — HTML/CSS (2014), Express
  (BE-02), Supabase (BE-03) are all already in my skillset. Vercel cold
  starts are ~1 second (no 30–60s Render-style spin-up). The only new step is
  adapting the Express app to a Vercel function handler, which is small.

## Option 2 — Middle: Static portfolio + serverless functions

- **How I would build it:** portfolio stays plain HTML/CSS; the demo is
  written as serverless functions (Vercel/Netlify Functions) + Supabase
  Postgres, one repo, one deploy.
- **Where I would host it (free):** Vercel or Netlify free tier.
- **Needs a backend?** Yes — in function form; no server to keep alive.
- **How well it shows my kind of work:** the same as Option 1, with the repo
  slightly more "modern" (everything under one project).
- **The real trade-off:** no sleeping server and no long cold starts, but it
  adds new concepts — serverless request handling (different shape from
  Express), per-request quotas (Netlify ~125k requests/mo, Vercel 100GB-h),
  and local-vs-deployed debugging. More to learn in a two-week window.

## Option 3 — Most powerful: Next.js full-stack on Vercel

- **How I would build it:** one Next.js app — portfolio pages, API routes,
  and the demo in a single codebase (React + Supabase).
- **Where I would host it (free):** Vercel free tier.
- **Needs a backend?** Yes — built-in API routes.
- **How well it shows my kind of work:** most modern and unified — one URL
  for everything.
- **The real trade-off:** this is the "framework" road, which the assignment
  itself warns is *almost never right for a portfolio*. I would have to learn
  React + Next.js while also building the demo — high risk of spending the
  two weeks fighting build errors instead of shipping. Highest maintenance
  surface of the three.

---

## AI's recommendation (the user decides)

**Option 1** — it is the smallest stack that does the job, every component is
already in the user's skillset (HTML/CSS, Express, Supabase), so it is the
only one that realistically finishes in two weeks. The cold-start concern is
removed by choosing Vercel over Render. "Finish beats fancy."
