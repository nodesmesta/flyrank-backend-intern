# Asset Guard — MVP Implementation Plan
> Solo dev · 10–15 hrs/week · Express/TypeScript + Supabase + Vercel · Target: 3–4 weeks

---

## Mental Model Before You Start

The MVP has one job: **a user uploads an asset document → sees a score → understands why**.
Everything else (monitoring, scraping, alerts) is Week 4+ or post-MVP.

**Ruthless scope rule:** If a feature doesn't appear in the Week 1 demo flow, it doesn't exist yet.

---

## WEEK 1 — Prove the Core Loop Works
> Goal: User signs in → uploads a PDF/spreadsheet → receives a score with reasoning.
> Estimated time: 12–14 hrs

---

### PHASE 0 — Project Scaffolding (2 hrs)

---

```
[] Initialize monorepo structure
```
- **Files to create:**
  - `package.json` (root, workspaces: `["apps/api", "apps/web"]`)
  - `apps/api/` — Express/TypeScript backend
  - `apps/web/` — React frontend (Vite or Next.js — **decide now**, see decision point)
  - `.env.example` with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`
- **Decision point:** Next.js vs plain React+Vite for the frontend
  - Pick **Next.js** if you want API routes to simplify auth callback handling
  - Pick **Vite+React** if you want a cleaner separation between Express API and frontend
  - **Recommended:** Next.js — fewer moving parts for solo dev, Vercel deploys it natively
- **Verify:** `npm run dev` starts both apps without errors
- **Error state:** Port conflicts → add `PORT` to `.env`, never hardcode
- **Depends on:** Nothing

---

```
[] Configure Supabase project
```
- **Files to create:**
  - `apps/api/src/lib/supabase.ts` — exports `supabaseAdmin` (service key client) and `supabaseClient` (anon key client)
- **Decision point:** Do you use Supabase Auth on the frontend (recommended) or roll your own JWT flow?
  - **Recommended:** Use `@supabase/auth-helpers-nextjs` — handles session refresh, SSR, and cookies automatically
- **Verify:** `supabaseAdmin.from('_test').select()` returns a Supabase error (not a network error) — proves connection works
- **Error state:** `Invalid API key` → you're using anon key where service key is needed. Service key bypasses RLS; never expose it to the browser
- **Depends on:** Supabase project created at supabase.com

---

```
[] Run database migrations — core schema
```
- **Files to create:**
  - `supabase/migrations/001_initial_schema.sql`

```sql
-- Users are managed by Supabase Auth (auth.users table)
-- We extend with a profiles table for app-level data

create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  company_name text,
  created_at timestamptz default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null check (category in ('property','equipment','ip','inventory')),
  status text not null default 'pending' check (status in ('pending','processing','scored','error')),
  score integer check (score between 0 and 100),
  score_breakdown jsonb,       -- { utilization: 40, roi: 30, market: 30 }
  improvement_steps jsonb,     -- [ { priority: 1, action: "...", impact: "..." } ]
  raw_extraction text,         -- extracted text from uploaded file
  file_path text,              -- Supabase Storage path
  file_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table assets enable row level security;
alter table profiles enable row level security;

create policy "Users own their assets"
  on assets for all
  using (auth.uid() = user_id);

create policy "Users own their profile"
  on profiles for all
  using (auth.uid() = id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger assets_updated_at
  before update on assets
  for each row execute function update_updated_at();
```

- **Verify:** `supabase db reset` runs clean; inspect tables in Supabase Studio
- **Error state:** Migration fails on `check` constraint → Postgres version may not support it; remove constraint and enforce in app layer instead
- **Depends on:** Supabase project configured

---

### PHASE 1 — Auth (1.5 hrs)

---

```
[] apps/web/src/lib/supabase-browser.ts
```
- **Responsibility:** Singleton browser Supabase client (anon key only)
- **Verify:** Import in a component, call `supabase.auth.getSession()` — returns null session for unauthenticated user (not an error)
- **Error state:** "Multiple GoTrueClient instances" warning → you're instantiating twice; use singleton pattern with `let client: SupabaseClient | null = null`
- **Depends on:** Phase 0

---

```
[] apps/web/src/pages/auth.tsx (or app/auth/page.tsx for Next.js)
```
- **Responsibility:** Single auth page handling both sign-up and sign-in via Supabase magic link (passwordless — fastest to ship)
- **Decision point:** Magic link vs email+password vs Google OAuth
  - **Recommended for MVP:** Magic link — zero password reset flow to build, users get it instantly
  - Add Google OAuth in Week 2 if time permits
- **Key logic:** Call `supabase.auth.signInWithOtp({ email })` → Supabase sends the link → user clicks → redirected to `/dashboard`
- **Verify:** Enter your own email → receive magic link → session established → `supabase.auth.getUser()` returns your user
- **Error state:** Email not delivered → check Supabase "Auth > Logs"; for local dev use Supabase's Inbucket (built-in email catcher)
- **Depends on:** supabase-browser.ts

---

```
[] apps/web/src/middleware.ts (Next.js) OR apps/web/src/lib/auth-guard.tsx
```
- **Responsibility:** Redirect unauthenticated users from `/dashboard/*` to `/auth`
- **Verify:** Navigate to `/dashboard` without session → redirected to `/auth`
- **Error state:** Infinite redirect loop → you have a bug in session detection; add `console.log` to middleware to confirm session value
- **Depends on:** auth.tsx

---

### PHASE 2 — File Upload (2 hrs)

---

```
[] Supabase Storage bucket setup
```
- **Action:** In Supabase Studio → Storage → New bucket: `asset-documents`, set to **private**
- **Add storage policy:**
```sql
-- Users can only upload/read their own files
create policy "User file access"
  on storage.objects for all
  using (auth.uid()::text = (storage.foldername(name))[1]);
```
- **File naming convention:** `{user_id}/{asset_id}/{filename}` — enforces path-based ownership
- **Verify:** Upload a test file via Studio; confirm it appears under the correct path
- **Error state:** 403 on upload → RLS policy not applied; check bucket is not public
- **Depends on:** Auth working

---

```
[] apps/api/src/routes/assets.ts
```
- **Responsibility:** All asset CRUD routes
- **Routes to implement (Week 1 only):**

```typescript
// POST /assets/upload
// - Receives: multipart/form-data with file + { name, category }
// - Validates: file type (pdf, xlsx, csv only), max size 10MB, required fields
// - Uploads file to Supabase Storage
// - Creates asset record in DB with status='pending'
// - Triggers scoring job (async, don't await)
// - Returns: 201 { asset_id, status: 'processing' }

// GET /assets
// - Returns all assets for authenticated user (ordered by created_at desc)

// GET /assets/:id
// - Returns single asset with full score_breakdown and improvement_steps
```

- **Decision point:** Where does file parsing happen — in the API route directly or a background job?
  - **For Week 1:** Parse inline (synchronous) to keep it simple. Move to a queue (BullMQ or Supabase Edge Functions) in Week 2
- **Edge cases:**
  - File > 10MB → return 413 with `{ error: 'File too large', max: '10MB' }`
  - Unsupported file type → return 415 with `{ error: 'Unsupported file type', allowed: ['pdf','xlsx','csv'] }`
  - Missing `name` or `category` → return 400 with `{ error: 'Missing fields', missing: ['name'] }`
  - Duplicate name per user → return 409 with `{ error: 'Asset name already exists' }`
- **Verify:** `curl -X POST /assets/upload -F "file=@test.pdf" -F "name=Office Building" -F "category=property"` → 201 + asset_id
- **Depends on:** Supabase client, assets table, storage bucket

---

```
[] apps/api/src/middleware/auth.ts
```
- **Responsibility:** Extract and verify Supabase JWT from `Authorization: Bearer <token>` header; attach `req.user` to request
- **Key logic:**
```typescript
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
req.user = user;
next();
```
- **Verify:** Call `/assets` without token → 401. Call with valid token → 200
- **Error state:** Token expired → Supabase returns `AuthApiError`; return 401 and let the client refresh the session
- **Depends on:** supabase.ts lib

---

```
[] apps/api/src/lib/file-parser.ts
```
- **Responsibility:** Extract raw text from uploaded files for AI processing
- **Libraries:** `pdf-parse` for PDFs, `xlsx` for spreadsheets, plain `fs.readFileSync` for CSV
- **Function signature:**
```typescript
async function extractText(filePath: string, mimeType: string): Promise<string>
// Returns: extracted text string, max 8000 chars (truncate with notice if longer)
```
- **Edge cases:**
  - Password-protected PDF → `pdf-parse` throws; catch and return `{ error: 'PDF is password protected' }`
  - Corrupted file → catch parse error, set asset status to 'error' in DB
  - Empty file → return empty string; score engine should handle gracefully
- **Verify:** Unit test: `extractText('test-assets/sample.pdf', 'application/pdf')` returns non-empty string
- **Error state:** `pdf-parse` sometimes fails on PDFs with unusual encoding; fall back to returning `"[Could not extract text from PDF]"` rather than crashing
- **Depends on:** Nothing (pure utility)

---

### PHASE 3 — Score Engine (3 hrs) ← The Core

---

```
[] apps/api/src/lib/score-engine.ts
```
- **Responsibility:** Call Claude API with extracted text → return structured score + reasoning
- **Decision point:** Do you write a rule-based scorer or use AI?
  - **Rule-based:** Fast, predictable, but requires you to define all the scoring logic manually per category
  - **AI-based (Claude):** You describe what "underutilized" means and let Claude score it — far more flexible for MVP
  - **Recommended:** AI-based. You already have an Anthropic API key implied. This is your product's core differentiator.

- **Implementation:**
```typescript
interface ScoreResult {
  score: number;                    // 0-100
  breakdown: {
    utilization: number;            // 0-40 pts
    roi_potential: number;          // 0-35 pts
    market_alignment: number;       // 0-25 pts
  };
  summary: string;                  // 2-3 sentence plain English summary
  improvement_steps: Array<{
    priority: number;               // 1-5
    action: string;
    estimated_impact: string;       // "Could increase score by 10-15 pts"
    timeframe: string;              // "2-4 weeks"
  }>;
  risk_flags: string[];             // e.g. ["Lease expires in 3 months"]
}

async function scoreAsset(
  extractedText: string,
  assetName: string,
  category: 'property' | 'equipment' | 'ip' | 'inventory'
): Promise<ScoreResult>
```

- **Prompt strategy (critical — this is your product):**
```
System: You are an asset productivity analyst. Score assets 0-100 where:
- 80-100: Highly productive, generating strong returns
- 60-79: Functional but has clear improvement opportunities  
- 40-59: Underutilized, significant value being left on the table
- 0-39: Stuck or idle, requires immediate attention

Return ONLY valid JSON matching the ScoreResult schema. No markdown, no explanation outside the JSON.

User: Analyze this {category} asset named "{assetName}":
{extractedText}
```

- **Edge cases:**
  - No text extracted (empty string) → return score of 50, summary: "Insufficient data to score accurately. Please upload a document with asset details."
  - Claude returns malformed JSON → retry once with explicit JSON repair prompt; if still fails, set status='error'
  - Claude API timeout (>30s) → return 504 to client; set asset status='error' with error_message
  - Text > 8000 chars → truncate before sending (Claude context is large but you pay per token)

- **Verify:** Unit test with a sample property description → score between 0-100, all fields present and typed correctly
- **Error state:** `JSON.parse` fails on Claude response → log the raw response for debugging; never surface raw Claude output to users

- **Depends on:** Anthropic SDK installed (`npm install @anthropic-ai/sdk`), file-parser.ts

---

```
[] apps/api/src/services/scoring-service.ts
```
- **Responsibility:** Orchestrates the full scoring pipeline (parse → score → save)
- **Function:**
```typescript
async function processAsset(assetId: string, filePath: string, mimeType: string): Promise<void> {
  // 1. Update status to 'processing'
  // 2. Extract text from file
  // 3. Call score engine
  // 4. Save results to DB
  // 5. Update status to 'scored'
  // On any error: update status to 'error', save error_message
}
```
- **Verify:** Call `processAsset(testId, testFilePath, 'application/pdf')` → asset record updated with score
- **Error state:** Any unhandled rejection → always catch at the top level and set status='error'; a stuck 'processing' asset is worse UX than an 'error' one
- **Depends on:** score-engine.ts, file-parser.ts, Supabase client

---

### PHASE 4 — Frontend Dashboard (3 hrs)

---

```
[] apps/web/src/pages/dashboard/index.tsx
```
- **Responsibility:** List all user assets with name, category, score badge, and status indicator
- **Components needed:**
  - `<AssetCard>` — shows name, category tag, score ring (0-100), status pill (pending/processing/scored/error)
  - `<EmptyState>` — shown when user has no assets; CTA to upload first asset
  - `<ScoreRing>` — SVG circle that fills based on score (green 70+, amber 40-69, red 0-39)
- **Real-time updates:** Use Supabase Realtime to update status without page refresh:
```typescript
supabase.channel('assets').on('postgres_changes',
  { event: 'UPDATE', schema: 'public', table: 'assets', filter: `user_id=eq.${userId}` },
  (payload) => updateAssetInList(payload.new)
).subscribe()
```
- **Verify:** Upload asset → status shows 'processing' in real-time → updates to 'scored' when done
- **Error state:** Realtime connection drops → add a fallback polling every 10s for assets in 'processing' state
- **Depends on:** Auth working, GET /assets endpoint

---

```
[] apps/web/src/pages/dashboard/upload.tsx
```
- **Responsibility:** File upload form with drag-and-drop
- **Fields:** Asset name (text), Category (select: property/equipment/IP/inventory), File (PDF/XLSX/CSV)
- **UX requirement:** Show upload progress bar; disable submit while processing
- **Library:** Use native `fetch` with `FormData` — no need for a library for MVP
- **Verify:** Upload a real PDF → redirected to dashboard → asset appears with 'processing' status
- **Error state:**
  - Network timeout → show "Upload failed. Try again." with retry button
  - 413 (too large) → show "File must be under 10MB"
  - 415 (wrong type) → show "Only PDF, Excel, and CSV files are supported"
- **Depends on:** POST /assets/upload endpoint

---

```
[] apps/web/src/pages/dashboard/assets/[id].tsx
```
- **Responsibility:** Full asset detail view — score breakdown, improvement steps, risk flags
- **Sections:**
  1. Score hero — large number, color coded, one-line summary
  2. Breakdown bars — utilization / ROI potential / market alignment as horizontal bars
  3. Improvement steps — prioritized list with impact and timeframe
  4. Risk flags — red warning pills if any exist
- **Verify:** Navigate to a scored asset → all sections populated with real data from Claude
- **Error state:** Asset in 'error' state → show "Scoring failed" with option to re-trigger scoring (add a retry button that calls `POST /assets/:id/rescore`)
- **Depends on:** GET /assets/:id endpoint

---

## WEEK 1 — End-of-Week Checklist

Before calling Week 1 done, verify this exact flow end-to-end:

```
[] User visits /auth → enters email → receives magic link
[] Clicks link → lands on /dashboard → sees empty state
[] Clicks "Upload Asset" → fills form → uploads a real PDF
[] Sees asset appear with 'processing' status (no page refresh needed)
[] Within 30 seconds, status changes to 'scored'
[] Clicks asset → sees score, breakdown, and improvement steps
[] All data is real (came from Claude, not hardcoded)
[] Signs out → /dashboard redirects to /auth
```

If this flow works, you have a shippable MVP. Everything else is polish.

---

## WEEK 2 — Reliability & UX (10–12 hrs)

> Goal: Make the core loop robust. Handle edge cases. Add enough polish to demo confidently.

---

### PHASE 5 — Background Job Queue (3 hrs)

The Week 1 approach (inline scoring) will timeout on Vercel (50s max for hobby, 300s for pro). Fix this in Week 2.

---

```
[] apps/api/src/lib/queue.ts
```
- **Decision point:** BullMQ (Redis-backed) vs Supabase Edge Functions vs Trigger.dev
  - **BullMQ:** Most control, requires Redis (use Upstash for free tier). Best for production
  - **Trigger.dev:** Zero infrastructure, generous free tier, built for exactly this use case
  - **Recommended:** Trigger.dev for solo dev — no Redis to manage, native retry/logging
- **Responsibility:** Queue a scoring job when asset is uploaded; process asynchronously
- **Pattern:**
  - Upload route: create asset record → enqueue job → return 201 immediately
  - Job worker: extract text → score → update DB
- **Verify:** Upload asset → API returns 201 immediately (< 1s) → asset gets scored within 60s
- **Error state:** Job fails → Trigger.dev auto-retries 3x; after max retries, set asset status='error'
- **Depends on:** scoring-service.ts, Trigger.dev account

---

```
[] apps/api/src/routes/assets.ts — add rescore endpoint
```
- **Route:** `POST /assets/:id/rescore`
- **Logic:** Re-enqueue scoring job for an asset in 'error' state; reject if already 'processing' or 'scored'
- **Verify:** Create an asset with status='error' → call rescore → status changes to 'processing' → eventually 'scored'
- **Error state:** Rescore called on a 'processing' asset → return 409 `{ error: 'Already processing' }`
- **Depends on:** queue.ts

---

### PHASE 6 — Error Handling & Loading States (2 hrs)

---

```
[] apps/web/src/components/ErrorBoundary.tsx
```
- **Responsibility:** Catch React render errors; show friendly error page instead of white screen
- **Verify:** Throw intentional error in a child component → ErrorBoundary catches it → shows error UI

---

```
[] apps/web/src/hooks/useAsset.ts and useAssets.ts
```
- **Responsibility:** Data fetching hooks with loading, error, and data states; handles Supabase Realtime subscription cleanup
- **Pattern:** SWR or React Query for caching — **Decision point:** pick one now
  - **Recommended:** TanStack Query (React Query) — better devtools, more mature
- **Verify:** Refresh dashboard page → assets load without flicker; navigate away → subscriptions cleaned up (no memory leaks in console)

---

### PHASE 7 — Scoring Prompt Refinement (2 hrs)

Week 2 is when you improve your prompt based on real outputs you saw in Week 1.

---

```
[] apps/api/src/lib/prompts/score-asset.ts
```
- **Responsibility:** Separate prompt template from score-engine logic; makes iteration faster
- **Add category-specific scoring criteria:**
  - Property: occupancy rate, lease terms, maintenance costs, location market trends
  - Equipment: utilization rate, depreciation, maintenance schedule, replacement cost
  - IP: licensing revenue, citation/usage data, expiry dates, market applications
  - Inventory: turnover rate, carrying costs, demand trends, obsolescence risk
- **Verify:** Score the same asset before/after prompt update → check if scores are more nuanced and actionable
- **Error state:** Prompt too long → Claude may truncate; keep system prompt under 500 tokens

---

### PHASE 8 — Basic Analytics Page (2 hrs)

---

```
[] apps/web/src/pages/dashboard/analytics.tsx
```
- **Responsibility:** Portfolio overview — average score, assets by category, score distribution
- **Components:**
  - Score distribution chart (simple bar chart — use Recharts)
  - Category breakdown (4 cards with count + avg score)
  - "Most at-risk assets" list (bottom 3 by score)
- **Verify:** With 3+ scored assets, all charts render with real data
- **Depends on:** GET /assets (already built)

---

## WEEK 3 — Demo-Ready Features (10–12 hrs)

> Goal: Features that make the demo impressive. Monitoring, comparisons, export.

---

### PHASE 9 — Asset Monitoring / Change Detection (4 hrs)

This is the "continuously monitors" part of your product description.

---

```
[] apps/api/src/services/monitor-service.ts
```
- **Decision point:** What do you monitor?
  - Option A: Re-score the asset on a schedule and detect score changes
  - Option B: Scrape external data (market rates, similar property listings) and flag changes
  - **Recommended for MVP:** Option A — re-score weekly and notify if score drops 10+ points. Add Option B in Week 4
- **Responsibility:** Scheduled job that re-scores all 'scored' assets older than 7 days
- **Implementation:** Trigger.dev cron job → fetch all assets due for rescore → enqueue scoring jobs
- **Verify:** Manually trigger the cron → check that assets get re-scored and `updated_at` changes

---

```
[] Supabase DB: add monitoring fields to assets table
```
- **Migration:** `supabase/migrations/002_monitoring.sql`
```sql
alter table assets
  add column last_scored_at timestamptz,
  add column previous_score integer,
  add column score_change integer generated always as (score - previous_score) stored,
  add column next_review_at timestamptz;
```
- **Verify:** After rescore, `previous_score` holds old score, `score_change` is computed automatically

---

```
[] apps/api/src/routes/notifications.ts
```
- **Responsibility:** `GET /notifications` — return recent score changes for the user
- **For Week 3:** Just show in-app. Email notifications are Week 4.
- **Verify:** Asset rescored with score drop → appears in notifications list

---

### PHASE 10 — Comparison View (2 hrs)

Key demo feature — shows the product's intelligence.

---

```
[] apps/web/src/pages/dashboard/compare.tsx
```
- **Responsibility:** Side-by-side comparison of two assets
- **UI:** Two-column layout, score rings side by side, improvement steps interleaved by priority
- **Verify:** Select two assets → comparison renders correctly; scores and steps shown for both
- **Depends on:** GET /assets/:id

---

### PHASE 11 — PDF Export (2 hrs)

Makes the demo feel like a real product ("I can send this to my CFO").

---

```
[] apps/api/src/routes/export.ts
```
- **Route:** `GET /assets/:id/export?format=pdf`
- **Library:** `@react-pdf/renderer` or `pdfkit`
  - **Recommended:** `pdfkit` — simpler API, no React dependency in the API
- **Content:** Asset name, score, score date, breakdown, top 3 improvement steps, risk flags
- **Verify:** Download PDF → opens correctly, all data present, looks professional
- **Error state:** Asset not yet scored → return 400 `{ error: 'Asset must be scored before export' }`
- **Depends on:** GET /assets/:id

---

### PHASE 12 — Onboarding Flow (2 hrs)

Critical for demos — you need to show it to someone who's never seen it.

---

```
[] apps/web/src/components/Onboarding.tsx
```
- **Responsibility:** 3-step onboarding shown to new users (first login only)
  1. "What kind of assets does your company manage?" (multi-select the categories)
  2. "Upload your first asset to get started"
  3. Score revealed with celebratory moment
- **State:** Track `onboarding_complete` in the `profiles` table
- **Verify:** New user → sees onboarding → completes it → flag set → never shows again
- **Depends on:** profiles table, upload flow

---

## WEEK 4 — Polish & Demo Prep (8–10 hrs)

> Goal: Make it feel like a real product. Fix all the rough edges before your interview.

---

### PHASE 13 — Web Scraping for Market Context (3 hrs)

The "automated monitoring" differentiator.

---

```
[] apps/api/src/services/web-scraper.ts
```
- **Decision point:** Build your own scraper vs use an API
  - **Build your own:** Playwright/Puppeteer — powerful, free, but complex to deploy on Vercel (no headless browser)
  - **Use an API:** Firecrawl, Diffbot, or ScrapingBee — simple, deployable anywhere, paid but cheap
  - **Recommended:** Firecrawl (has a free tier, simple API, Vercel-compatible)
- **What to scrape per category:**
  - Property: Zillow/LoopNet for comparable market rates
  - Equipment: eBay/Machinery Trader for resale value signals
  - IP: Google Patents/trademark databases for similar filings
  - Inventory: Industry pricing indices
- **Responsibility:** `enrichAssetWithMarketData(asset)` → appends market context to prompt before scoring
- **Verify:** Score an asset with market data vs without → score should differ; market context visible in score summary
- **Error state:** Scrape fails (site blocks bot) → log warning, proceed with scoring without market data (graceful degradation)

---

```
[] apps/api/src/lib/score-engine.ts — update to accept market context
```
- **Update prompt:** Add market data section after extracted text
- **Verify:** Score output mentions specific market figures from scrape

---

### PHASE 14 — Email Notifications (2 hrs)

---

```
[] apps/api/src/services/email-service.ts
```
- **Library:** Resend (free tier: 3,000 emails/month — more than enough)
- **Trigger:** Score drops 10+ points on rescore
- **Email content:** Asset name, old score → new score, top recommended action, link to full report
- **Verify:** Manually trigger score change → receive email within 2 minutes
- **Error state:** Resend API down → log error, don't crash the scoring job; retry email next day
- **Depends on:** monitor-service.ts, Resend account

---

### PHASE 15 — Demo Environment (2 hrs)

---

```
[] Seed script: scripts/seed-demo.ts
```
- **Responsibility:** Populate a demo account with 5–8 pre-scored assets across all categories
- **Include:** A mix of high scores (75+), medium (45-65), and low (20-35) for visual variety
- **Usage:** `npx ts-node scripts/seed-demo.ts --email demo@assetguard.com`
- **Verify:** Run script → log in as demo user → dashboard shows populated data immediately

---

```
[] Landing page: apps/web/src/pages/index.tsx
```
- **Sections:** Hero (problem statement), How it works (3 steps), Score example (screenshot/animation), CTA
- **Decision point:** Do you need a landing page for Week 4? Only if you're sending people to the URL cold. For interview demos, you can skip this and go straight to the app.

---

## Architecture Decisions Summary

Make these decisions before writing a line of code:

| Decision | Options | Recommended | When to Decide |
|---|---|---|---|
| Frontend framework | Next.js vs Vite+React | Next.js | Before Week 1 |
| Auth method | Magic link vs OAuth | Magic link (add OAuth week 2) | Before Week 1 |
| Scoring engine | Rule-based vs AI | AI (Claude) | Before Week 1 |
| Background jobs | BullMQ vs Trigger.dev | Trigger.dev | Before Week 2 |
| Data fetching | SWR vs React Query | React Query | Before Week 2 |
| Scraping | DIY vs API | Firecrawl | Before Week 4 |
| Email | SendGrid vs Resend | Resend | Before Week 4 |

---

## File Structure at End of Week 4

```
asset-guard/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── supabase.ts
│   │       │   ├── file-parser.ts
│   │       │   ├── score-engine.ts
│   │       │   ├── queue.ts
│   │       │   └── prompts/
│   │       │       └── score-asset.ts
│   │       ├── middleware/
│   │       │   └── auth.ts
│   │       ├── routes/
│   │       │   ├── assets.ts
│   │       │   ├── export.ts
│   │       │   └── notifications.ts
│   │       └── services/
│   │           ├── scoring-service.ts
│   │           ├── monitor-service.ts
│   │           ├── web-scraper.ts
│   │           └── email-service.ts
│   └── web/
│       └── src/
│           ├── lib/
│           │   └── supabase-browser.ts
│           ├── hooks/
│           │   ├── useAsset.ts
│           │   └── useAssets.ts
│           ├── components/
│           │   ├── AssetCard.tsx
│           │   ├── ScoreRing.tsx
│           │   ├── ErrorBoundary.tsx
│           │   └── Onboarding.tsx
│           └── pages/
│               ├── index.tsx          (landing)
│               ├── auth.tsx
│               └── dashboard/
│                   ├── index.tsx      (asset list)
│                   ├── upload.tsx
│                   ├── analytics.tsx
│                   ├── compare.tsx
│                   └── assets/[id].tsx
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_monitoring.sql
└── scripts/
    └── seed-demo.ts
```

---

## Time Budget

| Week | Hours Available | Phases | Buffer |
|---|---|---|---|
| Week 1 | 12–14 hrs | 0–4 (core loop) | 1 hr |
| Week 2 | 10–12 hrs | 5–8 (reliability) | 2 hrs |
| Week 3 | 10–12 hrs | 9–12 (demo features) | 2 hrs |
| Week 4 | 8–10 hrs | 13–15 (polish) | 2–3 hrs |

> **If you're running behind:** Cut Phase 13 (scraping) from Week 4 — the AI scoring alone is the differentiator. Scraping is a Week 5 enhancement, not an MVP requirement.
