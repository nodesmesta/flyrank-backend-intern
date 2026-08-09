# Personal Website — Live on the FlyRank Domain

**Assignment:** Personal Website Live on the FlyRank Domain
**Date:** August 8, 2026 (updated Aug 9, 2026 — migrated to Next.js + TypeScript, deployed to team `flyrankintern`)
**Stack:** Next.js 16 + TypeScript (static export) on Vercel free tier.

**The site is live and it works.** One page, built with Next.js + TypeScript,
deployed on Vercel, HTTPS by default, under a stable public URL:
https://muhamadjamaludin.vercel.app — the clean URL follows the
assignment's CV-worthy naming straight from the project name. It carries
the identity from the week-3 Identity Kit, the four live links (LinkedIn,
GitHub, resume, booking), and the space for future posts and capstone
work — and the DNS walkthrough for the future FlyRank subdomain is
already written.

---

## 1. Live URL

**https://muhamadjamaludin.vercel.app** (Vercel, production, team `flyrankintern`)

The deployment belongs to Vercel project `muhamadjamaludin` (per the
assignment's CV-worthy naming) in team `flyrankintern`. Because the
project carries this exact name, Vercel's auto-generated alias
`muhamadjamaludin.vercel.app` is the public entry point. The locally
built static export (`site/out/`) is uploaded as-is — no cloud build.

## 2. What the Page Contains

A single-page site (`site/src/app/page.tsx`) with:

- **Name + claim:** Muhamad Jamaludin — "Let's Build The Future"
- **Positioning:** Backend AI Engineer · AI Research & Innovation ·
  Security Compliance & Audits · Blockchain Architecture
- **Elevator line:** AI agents, agentic APIs, and security-first tools,
  backed by global hackathon awards and competitive security research
- **Highlights strip:** global hackathon wins (2,300+ participants) ·
  11 competitive security audit payouts
- **Experience:** FlyRank AI intern, independent hackathon builder,
  freelance security auditor — with real results (1st/2nd place of
  2,300+ participants, 11 competitive audit payouts)
- **Links:** LinkedIn (https://www.linkedin.com/in/muhamad-jamaludin-42178830a),
  GitHub, resume (Google Drive), and a Calendly booking link
- **Space for future posts and capstone work** (brief requirement)

The page follows the week-3 Identity Kit: Ubuntu headings, Roboto Slab
body, main color `#8511DF`, background `#F8F9FA`, accent `#E8D5F5`.

**Stack migration (Aug 9, 2026):** The site was originally built as static
HTML/CSS (`site/index.html`). Per user request, it has been migrated to
Next.js 16 + TypeScript with static export (`output: "export"` in
`next.config.ts`). The content and styling are identical — the migration
is purely a framework upgrade so the codebase aligns with the rest of the
workspace (Next.js + TS standard). All dependencies live in the repo root
`package.json` (no per-folder `package.json`, per the FL-07 workspace
rule), and build/dev/preview scripts are wired as `build:site`,
`dev:site`, `preview:site` alongside the portfolio scripts.

Source: `site/src/app/page.tsx` + `site/src/app/globals.css`.

## 3. Verified Live

- HTTP 200 from the production URL, served over HTTPS.
- Content check: exactly the intended page (names, claim, all four links
  present and correct — GitHub profile verified, LinkedIn, resume file,
  Calendly booking page all reachable).
- Deployment is a pure static export (`site/out/` uploaded as-is from
  the locally built App Router), deterministic and Ready in ~7s.
- Pending user action: open https://muhamadjamaludin.vercel.app in a
  private window (logged out) on a phone or second browser to confirm the
  clean public loading experience requested by the assignment.

## Screenshot

<div align="center">
  <img src="data/screenshot-live.png" width="65%">
</div>

## 4. DNS Walkthrough

The CNAME + resolver-to-response walkthrough (½–1 page, written for a
non-technical reader) is in
[data/dns-walkthrough.md](data/dns-walkthrough.md). When the FlyRank
subdomain is provisioned after capstone approval, the checklist at the
end of that file is the exact set of steps to run: Ops creates the CNAME,
I add the custom domain in Vercel, wait for propagation, and confirm the
padlock.

## 5. Linked From (user actions, pending)

- LinkedIn: add https://muhamadjamaludin.vercel.app to the profile
  (https://www.linkedin.com/in/muhamad-jamaludin-42178830a) website /
  contact section. No automated path — done manually by user.
- CV / resume: the current lean resume is kept as is; the URL is not
  added (user decision).

## 6. Conclusion

The assignment's core deliverable — a live HTTPS page on a clean public
URL — is shipped: https://muhamadjamaludin.vercel.app. The page states
who I am and what I build, links every profile that matters, and sets
aside space for the capstone work coming next. The DNS walkthrough turns
the future invitation into a checklist: when `muhamadjamaludin.flyrank.ai`
is provisioned, adding the custom domain is a pointer, not a migration.
The site is now the single entry point a person needs to reach me, my
code, my resume, and a booking link — ready to be shared today, and ready
to grow with the capstone.

## Notes

- Source of truth stays in the repo (`site/`), so the
  repository doubles as proof that the work ships.
- The deployment is a Vercel deployment of the static export; the
  free URL will be reused when the FlyRank subdomain is provisioned — a
  custom domain is a DNS pointer.
- **Migration note (Aug 9, 2026):** `site/index.html` (static HTML/CSS)
  was replaced by `site/src/app/` (Next.js + TypeScript); the Next.js
  source is now the single source of truth in the repo.
- **Stack decision:** Task.md does not require hand-written HTML — static site
  generators and AI-assisted builds are explicitly allowed. Next.js + TS
  aligns with the repo's standard stack.
