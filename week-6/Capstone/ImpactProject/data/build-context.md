# Build Context — Portfolio "Claude Project" (Project Instructions)

One page that captures everything the build context already knows about the
member, so the next case study is a short conversation, not a rebuild. This is
the preserved Project content built up across Weeks 1–4 (voice card, identity
kit, case studies, content map) plus the live facts of the current site.

---

## Who this is for

The AI build partner (Claude Project instructions). Keep this file in the
Project so any future "add a case" request starts from these decisions instead
of re-deriving them.

## Voice Card (Week 2, FrameYourWork)

> Direct, technical, deliverable, visionary, original.

## Proof Statement (Week 1)

> I translate abstract product ideas into deployed, testable AI prototypes,
> built for Product Managers at seed-stage startups — from a vague notion to a
> working, testable MVP within five days. Not a mockup, not a slide deck, but
> real running software.

## Identity Kit (Week 3, IdentityKit)

- Fonts: Ubuntu (headings), Roboto Slab (body) — self-hosted via next/font.
- Palette: `#8511DF` main, `#1A1A2E` near-black text, `#F8F9FA` near-white
  background, `#E8D5F5` accent (at most one).
- Logo: name set in the heading font, in `data/logo.png` (repo copy).
- Style note: "Warm and inviting — soft purple on clean white that feels like
  a space you want to stay in."

## Site Facts

- Live URL: https://muhamadjamaludin-portfolio.vercel.app
- Stack: Next.js (static export) + React + TypeScript, Vercel hosting,
  Formspree free tier for the one live feature (contact form).
- Pages: `/` (hero + claim), `/work` (cases), `/asset-guard` (product page),
  `/contact` (form).
- One action: Contact Me (start a prototype conversation).
- Hero claim (live): "I turn vague product ideas into AI prototypes you can
  test." — audience: product teams at early-stage startups; outcome: working
  MVP in five days.
- Standards that must hold: no text below 14 px, no tap target below 44 px,
  WCAG AA contrast, no horizontal overflow, crisp work images.

## Current Cases (Week 6 Work page, WorkList.tsx)

| Meta | Title | Stack | Source link |
|------|-------|-------|-------------|
| Personal Agent · MVP | Asset Signal Scout | TypeScript · Bright Data MCP · Node | week-5/GeneralAIFluency/FL-07 |
| Backend · Week 5 | Polite Scraper Pipeline | Express · Cheerio · SQLite | week-5/BE |
| Hackathons · Global | TrademarkGuardAI · ClaimPilot · BIM-Forge | AI · Rapid Build | github.com/nodesmesta |
| Security Research | Competitive Audits — 11 Payouts | Auditing · Blockchain | github.com/nodesmesta |

## Case Study Shape (Week 2, three beats)

Every case must have exactly three beats and could only describe this member's
project:

1. **The problem** — the real situation the work answered.
2. **What I did** — the build, and the decisions that mattered.
3. **What came of it** — what happened, measured, with numbers.

Written in the member's own words, voice card applied, no generic filler.

## Content Map (Week 3, MapContentAndCTAs)

- One action: Contact Me (test the live prototype / start a conversation).
- Work page: each card shows meta → title → tagline → body → stack + source
  link (source links are mandatory since the design review, Week 7).
- CTA banner on every page points to `/contact`.

## Repo Facts

- Monorepo: github.com/nodesmesta/flyrank-backend-intern (branch `main`).
- Task folders: `week-N/GeneralAIFluency/<Task>/` (regular assignments) and
  `week-N/Capstone/<Task>/` (capstone work) — each with `task.md`,
  `README.md`, `data/` (evidence), and isolated site snapshots under the task
  folder.
- Identity: Muhamad Jamaludin — GitHub github.com/nodesmesta, LinkedIn
  linkedin.com/in/muhamad-jamaludin, Calendly calendly.com/muhamadjamaludin,
  tagline "Lets Build The Future".
