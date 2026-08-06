# Week 5 · BE — The Polite Scraper

A small, honest web scraper for the books.toscrape.com catalogue. It is "polite"
on purpose: it respects robots.txt (via a hand-written parser), identifies
itself with a clear User-Agent, and rate-limits every request. Its output — a
structured SQLite database and a JSONL corpus — is the seed RAG corpus for
Week-6.

> Language of deliverables: English (this README). Language of the assignment
> folder: `week-5/BE/`.

---

## Pipeline

The scraper is a small, explicit pipeline — each stage is its own module, so
the whole thing is easy to read and to re-point at another site.

```
┌────────────┐   ┌─────────────┐   ┌──────────────┐   ┌───────────────┐
│ polite.ts  │ → │ extract.ts  │ → │  clean.ts    │ → │   store.ts    │
│ fetch +    │   │ parse HTML  │   │ normalize →  │   │ SQLite + JSONL│
│ robots +   │   │ (cheerio)   │   │ Book record  │   │ (RAG corpus)  │
│ rate-limit │   │ + pagination│   │ + validate   │   │               │
└────────────┘   └─────────────┘   └───────────────┘   └───────────────┘
```

- **polite.ts** — the polite layer. Hand-rolled `robots.txt` parser (RFC 9309),
  a clear User-Agent, and a per-request rate limit (default 1500 ms). Every
  fetch is logged.
- **extract.ts** — turns HTML into raw shapes with `cheerio`. Selectors live in
  one place (`selectors.ts`) so re-pointing the scraper at a different site is a
  one-file change, not a search-and-replace.
- **clean.ts** — merges a listing card + its detail page into one `Book` and
  normalizes values (price → number, "In stock (22 available)" → `inStock` +
  `stockCount`, "Three" → `3`, whitespace collapsed). Deterministic and typed.
- **store.ts** — writes to SQLite (`books` table, `url = PRIMARY KEY`) and an
  append-on-close JSONL corpus. Each run is a **fresh** corpus (the store is
  truncated on open) so JSONL never accumulates stale repeats.
- **index.ts** — the orchestrator: polite fetch the listing pages → collect
  book cards (dedupe by URL, capped by `limit`) → fetch each detail page →
  `clean` → `store`.

---

## Run it

From the repo root (scripts follow the monorepo `:be` convention):

```bash
npm run scrape:be5        # full scrape (limit from config) → SQLite + JSONL
npm run db:be5            # read-only inspection: counts, price/category/rating stats, JSONL integrity
npm run dev:be5           # watch mode (re-runs on file change)
```

Latest full run (evidence in `data/evidence/polite-run.log`):

```
[crawl] robots present: false | no robots.txt served (404/empty) — RFC default: permissive, still throttled
[crawl] UA: PoliteScraper/1.0 (week-5 BE assignment; contact: jamaludin@example.com)
[crawl] delay ms: 1500 | limit: 50
[polite] GET 200 /                                         (delay enforced)
[polite] GET 200 /catalogue/page-2.html                    (delay enforced)
[polite] GET 200 /catalogue/page-3.html                    (delay enforced)
[polite] GET 200 /catalogue/a-light-in-the-attic_1000/…   (delay enforced)
...
[done] saved=50 skipped=0 rows_in_db=50
```

53 polite HTTP requests total (3 listing pages + 50 book detail pages), all
separated by the configured 1.5 s delay, wall time ≈ 85 s.

---

## Configuration (`week-5/BE/.env` → `src/config.ts`)

| Variable | Default | Purpose |
|---|---|---|
| `SCRAPER_BASE_URL` | `https://books.toscrape.com` | target root |
| `SCRAPER_USER_AGENT` | `PoliteScraper/1.0 (…)` | identifies us, with contact |
| `SCRAPER_DELAY_MS` | `1500` | delay between requests (rate limit) |
| `SCRAPER_LIMIT` | `50` | max books scraped per run |
| `SCRAPER_LOG` | `1` | verbose request logging |

`.env` is git-ignored; `.env.example` documents the schema. The env file lives in
the task folder, not the repo root — the same per-task config convention used
by the other backend assignments in this repo.

---

## The polite layer (why this task exists)

1. **robots.txt** — parsed by our own hand-rolled parser (not a third-party
   lib): `User-agent` groups, `Disallow`/`Allow`, wildcards (`*`, `$`),
   `Crawl-delay`, and longest-rule-wins per RFC 9309. `books.toscrape.com`
   **does not publish a robots.txt** (404). Per RFC 9309 the absence defaults to
   permissive — but we *still* throttle and identify ourselves. That is
   documented in the run log and is honest: polite, not presumptuous.
   The parser is self-tested 9/9 cases (see `src/polite.ts`).
2. **User-Agent identity** — a named crawler with a contact address, not a
   browser spoof.
3. **Rate limiting** — shared delay between consecutive requests (1.5 s
   default), logged per request.

---

## Record shape (`Book`)

```ts
{
  url: string        // canonical detail URL (dedupe key)
  title: string
  price: number       // GBP, numeric (was "£51.77")
  inStock: boolean    // was "In stock"
  stockCount: number | null  // was "In stock (22 available)" → 22
  rating: number      // 1..5 (was "Three" → 3)
  category: string    // leaf category from breadcrumb
  upc: string
  description: string // normalized (whitespace-collapsed, content unchanged)
  imageUrl: string    // absolute cover URL
  reviews: number
  scrapedAt: string   // ISO timestamp of this run
}
```

SQLite `books` + `data/books.jsonl` hold exactly these records.

---

## Honest notes / real failure points

- **No robots.txt (404).** The target site has none. We handle the default
  (permissive) and keep throttling. This is a genuine failure point, resolved
  gracefully and visible in the log.
- **Descriptions carry seed-data duplication.** Some long descriptions contain
  repeated sentences + a trailing `...more` — this verbatim, from the site's
  own data. We normalize whitespace but deliberately do **not** rewrite prose
  (editing risks changing meaning).
- **Category `Default`.** Seven scraped titles report category `Default` on
  their breadcrumb. Genuine site data, not a parser bug.
- **All 50 books are `inStock=1`.** The first 50 catalogue titles happen to all
  be in stock. To see out-of-stock variety raise `SCRAPER_LIMIT` or target a
  specific category.
- URL resolution is done against the **page that was fetched** (listing page
  for cards/pagination, detail page for the cover image), not against the bare
  host — otherwise the relative `../../../` paths would resolve incorrectly on
  inner pages.

## Verification

- `tsc --noEmit` — clean across the whole monorepo (no regression to earlier
  backend assignments).
- Full run: 50 / 50 saved, 0 skipped; `rows=50`, `distinct urls=50`,
  `duplicates=0`.
- Price range £12.84–£57.31 (avg £35.14); 24 categories; rating spread
  1★×10 · 2★×8 · 3★×11 · 4★×8 · 5★×13.
- JSONL: 50 lines, 50 unique urls, **0 malformed**.

Run `npm run db:be5` for the live summary; snapshots are kept in
`data/evidence/` (`verification.txt`, `polite-run.log`).

---

## Output — ready for Week-6

`data/books.jsonl` is 50 self-contained JSON records intended as the **RAG
corpus** for the Week-6 build.

## Files

```
week-5/BE/
├── .env.example        # documented config schema
├── src/
│   ├── config.ts       # task-folder dotenv loader + defaults
│   ├── selectors.ts    # centralized site structure (one place to change)
│   ├── polite.ts       # robots parser + UA + rate limiter (value engine)
│   ├── extract.ts      # cheerio listing/detail extraction + normalizeText
│   ├── clean.ts        # Raw* → Book, deterministic normalization + validation
│   ├── store.ts        # SQLite + JSONL (RAG corpus), fresh per run
│   ├── db.ts           # read-only inspection CLI (npm run db:be5)
│   └── index.ts        # orchestrator entrypoint (npm run scrape:be5)
└── data/
    ├── books.jsonl      # 50-record corpus (deliverable)
    └── evidence/
        ├── polite-run.log      # full run log (robots + every request)
        └── verification.txt    # aggregates + JSONL integrity snapshot
```