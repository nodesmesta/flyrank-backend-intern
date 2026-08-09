# Deployment Walkthrough — Ship the Ugly One

How the portfolio got from source to its live URL, as it actually happened
(Aug 9, 2026). Every value below was observed during the deploy, not assumed.

## 1. The deploy

- **Team:** `flyrankintern` (created Aug 9, 2026 — the canonical team for new
  deployments, separate from the old `flyrank-intern`)
- **Project:** `muhamadjamaludin-portfolio` (created via `vercel link` from
  `site/out/`; the project name drives the alias)
- **Deployment URL:** `muhamadjamaludin-portfolio-mly8045qg-flyrankintern.vercel.app`
- **Alias (canonical):** `https://muhamadjamaludin-portfolio.vercel.app`
- **Wait:** `Ready in 1m` (static export, no build job — the `out/` directory
  was uploaded as-is)

The one-pager (`muhamadjamaludin.vercel.app`) and this portfolio live on
separate projects so each keeps its own alias and deployment history.

## 2. Why this URL and not the one in the first draft

The original README cited `https://muhamad-jamaludin.vercel.app` as live.
That URL 404s (old team project, since cleaned up). The final canonical URL
follows the same naming rule as the personal site: project name =
fetch-able alias, `muhamadjamaludin-portfolio.vercel.app`.

## 3. Verification — all pages HTTP 200

Checked with `curl`/HTTP GET against the live alias, not the local `out/`:

| Page | Path | Status | Content markers seen |
|------|------|--------|----------------------|
| Home | `/` | 200 | title `Muhamad Jamaludin — Let's Build The Future`, "Build", "Work" |
| Work | `/work` | 200 | "Asset", "hackathon", "audit" |
| Asset Guard | `/asset-guard` | 200 | "Asset Guard", "pricing" |
| Contact | `/contact` | 200 | "Contact", "LinkedIn" |
| 404 | `/404` | 200 | served (static export) |

## 4. Navigation check

Each page must reach every other page (brief: "navigation works"). Parsed the
live HTML and normalized trailing slashes:

```
/:          ->  /, /work, /asset-guard, /contact   OK
/work:      ->  /, /work, /asset-guard, /contact   OK
/asset-guard: -> /, /work, /asset-guard, /contact  OK
/contact:   ->  /, /work, /asset-guard, /contact   OK
```

## 5. Screenshots

All four screenshots in this folder were captured with a headless browser
(`chromium --headless --screenshot`, 1280x900) against the **live alias** —
not a local preview:

| File | Page | Size |
|------|------|------|
| `screenshot-home.png` | `/` | 107,081 B |
| `screenshot-work.png` | `/work` | 113,398 B |
| `screenshot-asset-guard.png` | `/asset-guard` | 701,413 B |
| `screenshot-contact.png` | `/contact` | 143,670 B |

(`asset-guard` is the largest because it carries `hero.png`, the 1.3 MB
image listed in the "still ugly" section.)

## 6. Rebuild path

- Source: `site/src/` (App Router, TS)
- Build: `npm run build:portfolio` (root script) → static export to
  `site/out/`, routes: `/`, `/_not-found`, `/asset-guard`, `/contact`, `/work`
- Deploy: `vercel link --yes --project muhamadjamaludin-portfolio --scope
  flyrankintern` then `vercel deploy --prod --yes` from `site/out/`