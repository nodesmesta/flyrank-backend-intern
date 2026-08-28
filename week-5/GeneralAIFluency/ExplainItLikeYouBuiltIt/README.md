# Explain It Like You Built It — The Portfolio Layout

**Assignment:** Explain It Like You Built It
**Piece of build explained:** one real part of the build — how the portfolio's
page structure turns a set of folders into many loadable URLs
**Live reference site:** https://muhamadjamaludin-portfolio.vercel.app
**Source:** `week-5/GeneralAIFluency/ShiptheUglyOne/site/`

---

## Summary

I picked one part of the build I genuinely had to sit down and understand:
how the site's folder structure becomes its pages. A Next.js site does not
"register" its pages anywhere — a page appears because a file named
`page.tsx` exists inside a folder under `src/app/`. The root `layout.tsx`
draws the shared frame (navbar, footer, main body) once, and each
`page.tsx` only supplies the middle content that is slotted into that frame.
Because the site is configured as a static export, the whole thing is
rendered to plain HTML files at build time, so Vercel simply serves those
files and needs no server. This README explains that piece as a structured
brief someone could hand to an AI — one build decision at a time, each with
its file, the choice being made, how to verify it, what can go wrong, and
what it depends on. I learned it the same way the brief asks: I answered
questions first, got corrected where I was wrong, and re-explained it in my
own words.

---

## How I Actually Got It (the learning session)

Like the task asks, I did not copy an explanation. I answered a typed
question, the AI corrected me, and I re-stated it. The corrections that
mattered most:

1. **Folders are the URL map, not a list in the code.**
   `app/page.tsx` is the home page (`/`), and `app/work/page.tsx` is `/work`.
   To add `/about` I only create `app/about/page.tsx` — I do **not** go touch
   the root `page.tsx`. The root page is `/`; it has nothing to do with
   other paths. I first thought I had to register the new page somewhere,
   and that was the wrong mental model.

2. **`page.tsx` returns content; it is not necessarily a "container".**
   A `work/page.tsx` file is just the function that returns that page's JSX
   and can pull in components (I use `<WorkList/>`, `<CtaBanner/>`). What
   decides the URL is where the folder sits, not how many components the page
   calls.

3. **The layout is a frame; children is the page.**
   `app/layout.tsx` wraps everything once — `<Navbar/>`, `<main>{children}</main>`,
   `<Footer/>`. `{children}` is a slot filled by the active route's `page.tsx`.
   Without it I would re-write the navbar and footer in every single page,
   which is exactly the duplication I want to avoid.

4. **It is a static render, not a running server.**
   `next.config.ts` sets `output: "export"`. At build time Next.js runs the
   React components once and writes plain `.html`/`.js`/`.css` into
   `site/out/`. It is not server-side rendering (no per-request work) and
   not client-side rendering (the render is not done in the browser) — it is
   static site generation. Vercel just hosts those finished files, so no
   Node backend is needed.

Those four points are the whole thing. What follows turns them into a build
brief.

---

## The Brief — Build the Page Structure with an AI

Below is the breakdown of how this piece is actually built, written the way
I would brief an AI to do it. Each stage is one build decision and carries
five fields: the **file/component** it touches, the **decision** being made,
how to **verify** it works, what can go **wrong**, and what it **depends on**.

### Stage 1 — Set the build to static export

In plain words: tell Next.js, once, to turn the whole site into plain
HTML files instead of a program that needs a server to keep running.
This is the real setting in the repo: `output: "export"` at `site/next.config.ts:4`.

| Field | Content |
|---|---|
| **File / Component** | `site/next.config.ts` (new; ref: `week-5/GeneralAIFluency/ShiptheUglyOne/site/next.config.ts:4`) |
| **Decision point** | Force the whole site to produce static files, not a Node server. Set `output: "export"`. Add `trailingSlash: true` so folder URLs resolve cleanly, and `images: { unoptimized: true }` because a static export has no image optimizer. |
| **Verification** | After a build, a `site/out/` directory exists containing `.html` files — proof nothing needs a runtime server. |
| **Error state** | If any page uses a server-only feature (dynamic request data), the `export` build fails and says it. The whole site must be renderable at build time. |
| **Dependency** | Nothing. This is the first decision of the structure. |

### Stage 2 — Draw the shared frame in `layout.tsx`

In plain words: draw the scaffolding every page shares (navbar on top,
body in the middle, footer on bottom) exactly once, so no page has to
redraw it. That real file is `site/src/app/layout.tsx` — it renders
`<Navbar/>`, `<main>{children}</main>`, then `<Footer/>`
(`layout.tsx:16-18`) and exports the site-wide `metadata`
(`layout.tsx:6-10`).

| Field | Content |
|---|---|
| **File / Component** | `site/src/app/layout.tsx` (new; ref: `week-5/GeneralAIFluency/ShiptheUglyOne/site/src/app/layout.tsx:12-21`) |
| **Decision point** | Decide what is constant for every page and draw it once: the `<html>`/`<body>` shell, the `<Navbar/>` at top, `<main>{children}</main>` for the page body, `<Footer/>` at bottom. Also export a `Metadata` object (site title/description) and import `globals.css` here. |
| **Verification** | Open any page: the navbar and footer appear, the middle content changes per route, and nothing is duplicated across `page.tsx` files. |
| **Error state** | If `children` is missing, the page has no body — the layout must always render `<main>{children}</main>`. |
| **Dependency** | Stage 1 (so the frame is part of a static render). Uses `<Navbar/>` and `<Footer/>` from `src/components/`. |

### Stage 3 — Let folders make the routes

In plain words: every time a folder is created under `src/app/` and a
`page.tsx` is put inside it, that becomes a loadable URL — no list of
pages anywhere, just the folder structure. The home page is
`src/app/page.tsx` (it composes `<Hero/>`, `<FeaturedWork/>`,
`<CtaBanner/>`, ref `page.tsx:13-18`); `/work` is
`src/app/work/page.tsx` (composes `<WorkList/>` + `<CtaBanner/>`, ref
`work/page.tsx:10-27`).

| Field | Content |
|---|---|
| **File / Component** | One `page.tsx` per route: `src/app/page.tsx`, `src/app/work/page.tsx`, `src/app/contact/page.tsx`, `src/app/asset-guard/page.tsx` (ref: `week-5/GeneralAIFluency/ShiptheUglyOne/site/src/app/{page,work/page,contact/page,asset-guard/page}.tsx`) |
| **Decision point** | Rely on App Router file-based routing: a `page.tsx` inside a folder under `src/app/` is the page for that folder's URL. The root folder is `/`; each named folder maps to its path. Each page returns its own JSX and pulls in the section components it needs. |
| **Verification** | Build, then check `out/` contains `out/index.html`, `out/work/index.html`, `out/contact/index.html`, `out/asset-guard/index.html`. Each URL loads its own content. |
| **Error state** | A folder with no `page.tsx` produces no page for that URL. Adding a new page is purely additive — it never requires editing an existing root page. |
| **Dependency** | Stage 2 (pages render inside the shared frame). Reads components from `src/components/`. |

### Stage 4 — Build the static pages and serve them

In plain words: run the build so the computer renders every React page
into finished HTML, then hand that folder to Vercel, which only has to
serve the files over the internet — no backend involved. The generated
output lives at `site/out/` in this repo (source of the live URL
https://muhamadjamaludin-portfolio.vercel.app), produced by the static
config from Stage 1 (`next.config.ts:4`).

| Field | Content |
|---|---|
| **File / Component** | `site/out/` (generated artifact; ref: `week-5/GeneralAIFluency/ShiptheUglyOne/site/out/`), deployed to Vercel (team `flyrankintern`, project `muhamadjamaludin-portfolio`) |
| **Decision point** | Run the static build so all React components are rendered to plain HTML/JS/CSS in `site/out/`, then upload that finished folder. Vercel acts only as a static host — it serves the files over HTTPS and adds caching; no backend or database is involved. |
| **Verification** | Curl the live routes (`/`, `/work`, `/contact`, `/asset-guard`) and get HTTP 200 with HTML that includes the rendered navbar/footer. |
| **Error state** | A blank or hallucinated page usually means the build did not re-run before deploy, or a page depends on runtime data a static export cannot provide. |
| **Dependency** | Stages 1–3 (this is the finished, frozen artifact of all the above). |

---

## Pass / Revise Check

| Requirement | Result |
|---|---|
| A real piece of the build, not a generic tutorial topic | **PASS** — one concrete part of this site: structure/folder-to-URL routing |
| Explanation is in my own words and actually correct | **PASS** — learned via Q&A (layout frame, children slot, static export, folder routing) and corrected the two wrong mental models (registering a page in root; client-side render) |
| Demonstrates learning, not pasted output | **PASS** — the "how I actually got it" section records the corrections, and the brief is built from the corrected understanding |

---

## Conclusion

The portfolio is a small site, but understanding the one idea that makes it
work changes how I see the whole build. The pages are not listed anywhere in
code; they exist because a folder was created and a `page.tsx` was dropped
into it. A single `layout.tsx` draws the frame every page shares, and because
the site is a static export, the computer turns all of that into finished
HTML files at build time so a host like Vercel only has to hand them out. I
came in thinking a new page meant editing the index to register it, and a
static site meant something rendered in your browser — both were wrong. Now
I can explain, in plain words, and in the structured form of a brief to an
AI, exactly how the page structure of this project genuinely gets built.