# Survive the Crit — Design Review, Must-Fixes Fixed on the Live Site

**Assignment:** Survive the Crit (Week 7 · Checkpoint 1: Design Review)
**Live URL:** https://muhamadjamaludin-portfolio.vercel.app
**Date:** August 27, 2026
**Reviewer:** fellow student / friend (arranged by the member)

The live portfolio was submitted for design review together with the Week-1
proof statement, real feedback was collected without defending, the feedback
was sorted honestly into must-fix vs. nice-to-have, and the must-fixes are
now fixed and verified on the live site — not just acknowledged.

---

## 1. What Was Submitted to the Reviewer

- **Live portfolio:** https://muhamadjamaludin-portfolio.vercel.app
- **Proof statement (Week 1):** "I translate abstract product ideas into
  deployed, testable AI prototypes, built for Product Managers at seed-stage
  startups — from a vague notion to a working, testable MVP within five days.
  Not a mockup, not a slide deck, but real running software."

The reviewer was asked to judge the site against that actual job, then asked
the two required questions first, then invited to give the rest of the
feedback freely. The full review kit (message sent, verbatim answers) is in
[`data/review-kit.md`](data/review-kit.md).

## 2. The Reviewer's Raw Feedback (verbatim)

| # | Question | Answer |
|---|----------|--------|
| 1 | In ten seconds, what do I do? | "saya merasa pekerjaan kamu adalah arsitek, seperti ajakan membangun" |
| 2 | Would you believe I'm good at it? | "saya percaya, karena saya tidak seberapa memahami AI tapi saya tahu anda adalah orang yang hebat di bidang tersebut" |
| 3 | What confused you / made you want to leave? | "hal yang membuat saya bingung adalah secara jujur saya tidak memahami produk apa yang ditawarkan" |
| 4 | Anything broken, missing, or doesn't land? | "saat saya mengakses https://muhamadjamaludin-portfolio.vercel.app/asset-guard saya mencoba klik button yang tersedia dan tidak terjadi apapun." |
| 5 | Does the proof land? | "saya tidak seberapa percaya, semua sumber portofolio yang dimiliki bagus, namun menurut saya itu tersembunyi" |
| 6 | Would you take the main action? | "menurut saya tidak, halaman awal masih kurang menjelaskan dengan baik (ui/ux) nya masih cenderung kurang baik" |
| 7 | Anything else | "tidak ada" |

## 3. The Sort — Must-Fix vs Nice-to-Have

### Must-fix (blocks the one action / the proof doesn't land)

| ID | Feedback it answers | Why must-fix |
|----|---------------------|--------------|
| M1 | Q1, Q3, Q6 | The hero never stated the job. The reviewer guessed "arsitek" because the claim ("Let's Build The Future") and four parallel roles obscured what the member actually does. This is the "couldn't tell what you do" failure the brief warns about. |
| M2 | Q3, Q5 | No product/offer was understandable and the evidence was hidden: work cards had no demo/repo links at all, so the proof (real repos, run logs, reports) could not be clicked and judged. |
| M3 | Q4 | Broken interaction, verified in source: the pricing buttons on `/asset-guard` were `<span>` elements with no href and no handler — clicking did nothing. |

### Nice-to-have (later)

| ID | Note |
|----|------|
| N1 | General UI/UX polish of the landing page. Most of the perceived "kurang baik" is a side effect of M1 (no clear claim) and M2 (no visible proof); after M1–M3 the residual is minor spacing/hierarchy polish, deliberately left for later. |
| N2 | Q2's confidence came from personal knowledge of the member, not from the site ("saya tahu anda adalah orang yang hebat"). No fixable site issue — it only strengthens the case for M1/M2. |

## 4. Must-Fixes Addressed on the Live Site

### M1 — Hero rewritten so the claim lands in seconds

Before: "Let's Build The Future" + four roles (Backend AI Engineer · AI
Research & Innovation · Security Compliance & Audits · Blockchain
Architecture).

After (live on `/`):

> **I turn vague product ideas into AI prototypes you can test.**
> For product teams at early-stage startups: bring the idea, get a working
> MVP in five days.

The four-role line is gone (it caused the "arsitek" guess). The proof
(2,300+ participants, 11 audit payouts) stays as a small supporting line,
not the headline. The primary call to action is now **Contact Me** (the one
action for the proof statement's audience: start a prototype conversation),
with **See the Work** secondary.

### M2 — Evidence is now clickable on the Work page

Each work card now carries a real source link (verified against the public
repo — `git ls-remote` without auth resolves `origin/main` = `a5d864b`, and
the referenced paths exist on that branch):

| Card | Link added |
|------|------------|
| Asset Signal Scout | `Source: FL-07` → github.com/nodesmesta/flyrank-backend-intern/tree/main/week-5/GeneralAIFluency/FL-07 |
| Polite Scraper Pipeline | `Source: week-5 BE` → github.com/nodesmesta/flyrank-backend-intern/tree/main/week-5/BE |
| Hackathons & Audits | `GitHub profile` → github.com/nodesmesta |

### M3 — Pricing buttons on `/asset-guard` work now

`Try Free`, `Start Growth`, and `Contact Us` are now real links to `/contact`
(Asset Guard is still honestly labeled "in design — planned model, not live
billing"; the buttons open a conversation instead of pretending to a billing
flow that does not exist).

### No regressions

The new interactive elements (source links, pricing buttons) were brought up
to the site's existing 44 px tap-target standard, so the mobile/accessibility
gains from the previous assignment still hold (see verification below).

## 5. Verification — Local Build and Live URL

### Local production build (`SurvivetheCrit/site`, isolated snapshot)

- `tsc --noEmit`: pass
- Contact-form tests: 3/3 pass
- `next build`: success, 6 static pages
- Audit (4 pages × 3 viewports): all HTTP 200, 0 px overflow, 0 console
  errors, 0 page errors, no text < 14 px, no tap target < 44 px
- Evidence: [`data/after-local/`](data/after-local/)

### Live production URL (after deploy)

| Check | Result |
|-------|--------|
| 4 pages × 3 viewports | HTTP 200 everywhere |
| Horizontal overflow | 0 px on every page |
| Console / page errors | 0 |
| Text below 14 px | 0 |
| Tap targets below 44 px | 0 |
| Hero claim | "I turn vague product ideas into AI prototypes you can test." (live) |
| Work source links | present, pointing at the public repo (paths verified via `git ls-remote` / `git ls-tree` on `origin/main`) |
| Pricing buttons | 3 × real links to `/contact` |
| Contact form | still present, unchanged |
| Mobile load (phone viewport) | `/` 439 ms, `/work` 173 ms, `/asset-guard` 148 ms, `/contact` 152 ms |

Screenshots + machine-readable metrics: [`data/after/`](data/after/)
(`report.json` plus mobile/tablet/desktop captures of all four pages).

## 6. Reply to the Reviewer — What Changed

> Thanks for the honest review — exactly what I needed. Here's what changed
> because of it:
>
> 1. The landing headline now says what I actually do: "I turn vague product
>    ideas into AI prototypes you can test" — the old tagline made you guess
>    "arsitek", so it's gone.
> 2. The Work page now links every project to its real source (repo + GitHub
>    profile), so the proof is no longer hidden.
> 3. The pricing buttons on Asset Guard that did nothing now open the contact
>    page.
>
> The site is live at the same URL — https://muhamadjamaludin-portfolio.vercel.app

## 7. Pass / Revise Check

| Requirement | Result |
|-------------|--------|
| Portfolio submitted with its proof statement | PASS — review kit includes the Week-1 proof statement |
| Real feedback received | PASS — verbatim answers from a real reviewer (section 2) |
| Reviewer could state what the member does, or gaps now fixed | PASS — reviewer's gap ("arsitek" guess) fixed by M1; live claim states the job |
| Feedback sorted honestly into must-fix vs. nice-to-have | PASS — section 3 |
| Must-fixes actually fixed on the live site | PASS — section 4, verified live in section 5 |
| Member engaged rather than defended | PASS — all feedback recorded verbatim, no rebuttals, fixes shipped |

## 8. Files Changed (isolated snapshot)

| File | Change |
|------|--------|
| `site/src/components/Hero.tsx` | M1: new claim + one-line audience/outcome; four roles removed; CTA reordered |
| `site/src/components/WorkList.tsx` | M2: real source links on every work card |
| `site/src/components/Pricing.tsx` | M3: dead `<span>` buttons → real `<a href="/contact">` |
| `site/src/app/globals.css` | ≥44 px tap targets for the new links/buttons |
| `data/review-kit.md` | review kit + verbatim reviewer answers |
| `data/after/`, `data/after-local/` | audit evidence (screenshots + `report.json`) |

The week-6 `MakeItDoSomething/site` source (the previous checkpoint) was not
modified; `SurvivetheCrit/site` is an isolated snapshot per the repository's
continuity convention.

## Conclusion

The gate is cleared with evidence: a real reviewer looked at the live site
with the proof statement in hand, their feedback is recorded verbatim and
sorted without defensiveness, and every must-fix is fixed and re-verified on
the live URL — the hero says the job in ten seconds, the proof is clickable,
and the dead buttons work.
