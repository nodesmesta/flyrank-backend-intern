
# ChooseYourStackwithAI — Three Roads: Choose Your Stack with AI

**Domain:** Asset Management SaaS (Asset Guard) portfolio
**Date:** August 6, 2026
**AI used:** Hermes Agent acted as the AI adviser (Prompt 1 in
[data/prompts.md](data/prompts.md)). The AI laid out options and trade-offs;
the decision is mine.

---

## 1. The Constraints I Gave the AI

1. **Free only** — every tool and host must have a workable free tier.
2. **Honest skill level** — HTML and CSS since 2014 (solid basics, long
   unused); today a backend developer intern, comfortable with TypeScript,
   Express, Node, Supabase, and SQLite; not yet comfortable with frontend
   frameworks.
3. **What the portfolio must do** — a 7-page Asset Guard site (Hero,
   Features, Orchestration, Pricing, Consumer Say, CTA, Footer), with each
   case study linking to its GitHub repository and readable as long-form
   technical writing.
4. **How the work must be shown** — code repositories (GitHub links) and
   long-form technical case studies. No heavy image galleries, no embedded
   media.
5. **Dynamic at launch — YES** — visitors must be able to try a live demo
   (upload an asset document and see it scored), so a backend and a database
   must actually run somewhere, free.

## 2. Three Options (Simplest -> Most Powerful)

Full output: [data/options.md](data/options.md)

| | Option 1 - Static + separate demo | Option 2 - Static + serverless | Option 3 - Next.js full-stack |
|---|---|---|---|
| **Build** | Plain HTML/CSS portfolio + small Express API, Supabase Postgres | Static portfolio + serverless functions + Supabase | One Next.js app: pages, API routes, demo |
| **Free host** | Vercel (portfolio + demo), Supabase free | Vercel or Netlify free | Vercel free |
| **Backend?** | Yes - demo only, as a separate service | Yes - functions, no server to keep alive | Yes - built-in API routes |
| **Shows my work** | Case studies + repo links + live demo link | Same as Option 1 | Most unified, one URL |
| **Trade-off** | Nothing new to learn, ~1s cold start | No sleeping server, but new serverless concepts + quotas | Steep React/Next.js learning curve, highest maintenance |

## 3. Pressure-Test of the Front-Runner (Option 1)

- **What breaks if I pick the simplest?** Nothing structural. The two
  friction points are managing two repos/hosts (portfolio + demo) and the
  demo's free-tier limits (Vercel quota, Supabase free storage). If the demo
  outgrows the free tier, only the demo moves - the portfolio is untouched.
- **What do I maintain if I pick the most powerful?** A React/Next.js
  codebase: dependency updates, build config, framework versions - plus
  learning React before I could maintain anything at all. That is a second
  job, not a portfolio.
- **Can I finish in two weeks?** Yes. The portfolio is 7 static pages whose
  content already exists in the content map; the demo is a small Express +
  Supabase service, which is the BE-02/BE-03 pattern I already ship. No new
  concepts to master.
- **Does it show my work the way it needs to be shown?** Yes - long-form
  case studies, a GitHub repo link per case study, and a live demo reachable
  from the "Test the live prototype" CTA.

## 4. Decision & Rationale

**Chosen stack:** Option 1 - static HTML/CSS portfolio + Express demo backed
by Supabase Postgres, all hosted free on Vercel.

**Why I chose it:** it is the smallest stack that does the job, and every
piece of it is already in my skillset - HTML/CSS from my earliest days,
Express from BE-02, Supabase from BE-03. That is what makes it finishable in
two weeks and maintainable afterwards.

**Can I maintain this?** Yes. I am comfortable maintaining it because Vercel
is the hosting I already know, and the rest is the same Express + Supabase
stack I work with every week. Nothing here is something I would have to learn
while also trying to ship.

**Does it show my work well?** Yes. Turning my work into a working
proof-of-concept is the exciting part - visitors don't just read about Asset
Guard, they try it. The case studies show the engineering in long form, each
with its repository attached, and the live demo proves the prototype
actually runs.

**Why not the other two:** Option 2 avoids a sleeping server but asks me to
learn serverless request handling. Option 3 is the "framework" road that the
assignment itself warns is almost never right, trading a two-week finish for
fighting React build errors and the most to maintain.

**The backend question, answered honestly:** Yes, this stack has a backend -
because the live demo is the proof, and a demo that scores an uploaded asset
needs a server and a database. The portfolio itself stays 100% static.

*Deliverable: this rationale, submitted to the internship portal (week-4
assignment card - rationale in Notes).*
