# How to Add the Next Case Study

The short, concrete note the Impact Project brief asks for: exactly where the
next case study goes, and the steps to add one. No vague intention — each step
names a real file, a real command, or a real check.

---

## Where the next case study goes

Two places, kept in sync:

1. **The work page card** — the live portfolio renders cases from the `cases`
   array in `site/src/components/WorkList.tsx` (in the current isolated site
   snapshot under the task folder). A case is one object in that array:
   `meta`, `title`, `tagline`, `body`, `stack`, and a `source` link pointing at
   the public repo so the proof is clickable (mandatory since the design
   review).
2. **The case study document** — the full three-beat write-up lives as a
   markdown file in the task's `data/` folder (same convention as
   `week-2/GeneralAIFluency/FrameYourWork/data/case-study-asset-guard.md`), so
   the story behind the card is versioned with the work itself.

## The shape: three beats (Week 2 rule)

Every case has exactly three beats and could only describe this member's work:

1. **The problem** — the real situation the work answered (not a buzzword).
2. **What I did** — the build plus the decisions that mattered.
3. **What came of it** — what happened, measured, with numbers.

Written in the member's own words, voice card applied ("direct, technical,
deliverable, visionary, original"), no generic filler.

## Steps to add one

1. **Gather the real material.** Open the task folder of the work being added
   (`week-N/.../README.md`, its `data/` evidence, the commits). Pull the
   numbers, the failure points, and the honest surprises — never invent them.
2. **Interview, don't author.** Ask the AI one question at a time until the
   problem, the decisions, and the outcome are clear (Week 2 format). Answer
   honestly and messily; the draft comes from those answers, in your words.
3. **Write the three beats.** Draft `data/case-study-<name>.md` with the three
   beats, edit hard, read it out loud, cut anything you would not say.
4. **Add the card.** Insert the case object into the `cases` array in
   `WorkList.tsx` — `meta` (type · week), `title`, one-line `tagline`, a
   `body` of 2–3 sentences, `stack`, and a `source` link verified against the
   public repo (e.g. `github.com/nodesmesta/flyrank-backend-intern/tree/main/
   week-N/...`).
5. **Build and audit locally.** `npx tsc --noEmit` and `npx next build` on the
   snapshot, then the multi-viewport audit (no overflow, no console errors,
   text ≥14 px, tap targets ≥44 px).
6. **Deploy and verify live.** Deploy the snapshot to Vercel, confirm the new
   card renders on `/work` at the live URL, and update this portfolio
   README/verification with the check.
7. **Reply with what changed** when a reviewer asked for it (design-review
   convention): the link, the new case, and the one-sentence summary.

## Cost of the next case

Because the build context is preserved (`data/build-context.md` — voice card,
identity kit, proof statement, site facts, repo conventions), step 2 starts
from a project that already knows the member's voice, stack, and style. The
next case is a short conversation, not a rebuild: the model call is one
interview + one draft, and the site change is one array entry plus a deploy.
