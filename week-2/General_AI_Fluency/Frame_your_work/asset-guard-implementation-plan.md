# Asset Guard — Implementation Plan

## Concept Summary
Asset Guard is a SaaS that helps companies track and optimize stuck or underutilized assets (property, equipment, IP, inventory). Users upload asset docs, the system assigns a productivity score, provides improvement steps, and continuously monitors for new opportunities.

---

## Phase 0: Validation & Scoring Model (MVP before code)

### 0.1 Manual Scorecard Framework
- Define asset categories: Property, Equipment, IP, Inventory
- For each category, define productivity dimensions (utilization rate, revenue generation, maintenance cost, market demand, depreciation)
- Create a weighted scoring formula (0-100 scale)
- Hand-score 5-10 real assets to validate the model works
- Refine weights based on what "stuck" actually looks like in real data

### 0.2 User Research
- Interview 3-5 potential users (ops managers, CFOs, warehouse leads)
- Validate: would they upload documents? What decisions would the score inform?
- Identify the top-2 asset categories to launch with (likely Inventory and Equipment)

---

## Phase 1: Foundation (Weeks 1-3)

### 1.1 Project Setup
- Initialize monorepo (Next.js + Supabase + Vercel)
- Set up Supabase project: auth, database schema, storage buckets
- Configure CI/CD pipeline (Vercel + GitHub Actions)
- Set up dev/staging/production environments

### 1.2 Database Schema
```sql
-- Core tables
users (id, email, company_name, tier, created_at)
assets (id, user_id, name, category, description, status, created_at, updated_at)
asset_documents (id, asset_id, file_url, file_type, uploaded_at)
productivity_scores (id, asset_id, score, dimensions_json, scored_at)
improvement_steps (id, asset_id, step_text, priority, status, created_at)
monitoring_jobs (id, asset_id, keyword, frequency, last_run_at, next_run_at)
monitoring_results (id, job_id, source_url, summary, risk_level, found_at)
alerts (id, user_id, asset_id, message, severity, read, created_at)
```

### 1.3 Authentication & Onboarding
- Email/password + Google OAuth via Supabase Auth
- Company registration flow
- Guided first-time onboarding (upload first asset)
- Tiered access: Free (3 assets) vs Pro (unlimited, automated monitoring)

### 1.4 File Upload Infrastructure
- Supabase Storage bucket per user/company
- Upload widget with drag-and-drop (PDF, images, spreadsheets)
- File size limits with progress indicator
- Server-side file validation (type, size, virus scan)

---

## Phase 2: Core Engine (Weeks 4-6)

### 2.1 Document Processing Pipeline
- Parse uploaded PDFs/images using OCR/Tesseract or document parser API
- Extract key fields: asset name, description, purchase date, value, location, condition
- Fallback: manual field entry form for poor-quality documents
- Store structured metadata in the assets table

### 2.2 AI Scoring Engine
- Build prompt chain (or fine-tuned model) that evaluates asset productivity
- Scoring dimensions per category:
  - **Inventory**: turnover rate, days on shelf, demand trend, carrying cost
  - **Equipment**: utilization %, maintenance ratio, age, resale value
  - **IP**: licensing revenue, filing status, market relevance
  - **Property**: occupancy rate, location demand, maintenance cost
- Return a score (0-100) + dimension breakdown + reasoning
- Implement confidence intervals — flag low-confidence scores for human review

### 2.3 Improvement Recommendation Engine
- For each low-scoring dimension, generate actionable steps
- Examples:
  - "Sell this equipment — resale value is high but utilization is under 10%"
  - "License this patent to [industry] — similar IP earns $X/yr"
  - "Run a flash sale on 200 units of slow-moving inventory"
- Prioritize by impact (quick wins first)
- Store recommendations as structured data with status tracking

### 2.4 Scoring Dashboard
- Asset list view with score indicators (color-coded: green/yellow/red)
- Single asset detail page: full score breakdown, recommendations, history
- Score trend chart over time
- Export report as PDF

---

## Phase 3: Automated Monitoring (Weeks 7-9)

### 3.1 Background Job System
- Supabase Edge Functions (or cron jobs on Vercel) running hourly/daily
- Each monitoring job uses asset name + category as a keyword
- Scrape public sources: marketplace listings, news, patent databases, industry reports
- Detect new opportunities (price increases, buy offers, new licensing deals)
- Detect risks (price drops, regulatory changes, new competitors)

### 3.2 Smart Alerting
- Configurable alert thresholds per asset category
- Alert channels: in-app notification + email + optional Slack/Telegram webhook
- Alert types: score drop, new opportunity, risk detected, recommendation available
- Digest mode (daily summary) vs real-time for critical alerts

### 3.3 Data Source Integrations
- **Inventory**: scrape e-commerce platforms, commodity price feeds
- **Equipment**: secondary marketplaces (eBay, Ritchie Bros, industry-specific)
- **IP**: USPTO/Google Patents API, licensing marketplaces
- **Property**: commercial real estate listings, CoStar alternatives
- Allow users to add custom data sources via webhook or RSS

---

## Phase 4: Growth & Monetization (Weeks 10-12)

### 4.1 Tiered Plan Implementation
- **Free**: 3 assets, manual scoring only, no monitoring
- **Pro ($29/mo)**: 50 assets, AI scoring, automated monitoring, email alerts
- **Enterprise ($99/mo)**: Unlimited assets, custom categories, API access, SSO, dedicated support

### 4.2 Billing Integration
- Stripe checkout with monthly/annual toggle
- Usage-based add-ons (extra monitoring jobs, additional users)
- Free trial (14 days Pro features)
- Graceful downgrade (lock to read-only, don't delete data)

### 4.3 Shared Asset Marketplace (Stretch)
- Users can optionally list "assets for sale/lease" on a public marketplace
- Asset Guard takes a small commission
- Creates liquidity for stuck assets — turns the product into a marketplace

### 4.4 API & Integrations
- REST API for asset CRUD, scoring, monitoring results
- Webhooks for alert delivery
- Zapier/Make.com connector for non-technical users
- ERP integrations (QuickBooks, SAP, NetSuite) — deferred to later

---

## Phase 5: Polish & Scale (Post-Launch)

### 5.1 Performance & Reliability
- CDN for stored documents
- Query optimization for dashboard at scale
- Rate limiting on scoring API to manage AI costs
- Monitor scoring accuracy with user feedback loop (thumbs up/down on recommendations)

### 5.2 Advanced Features
- Portfolio view: see all assets across an entire company
- Benchmarking: compare asset scores against industry averages
- AI-powered valuation estimates
- Automated asset tagging and categorization
- Team collaboration: multiple users per company with role-based access

### 5.3 Compliance & Security
- SOC 2 readiness (encryption at rest, audit logs, access controls)
- GDPR data deletion workflows
- Document retention policies
- Penetration testing before financial data handling

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Next.js (Vercel) | Fast deploys, SSR for SEO, easy edge functions |
| Backend | Supabase + Edge Functions | Postgres, auth, storage in one platform |
| AI Model | GPT-4 / Claude via API | No need to train; prompt engineering suffices at MVP |
| File Storage | Supabase Storage (S3-compatible) | Integrated with auth policies |
| Background Jobs | Vercel Cron Jobs → Edge Functions | Serverless, no infra to manage |
| Monitoring Scrapes | Bright Data / Puppeteer | Reliable data extraction from any source |
| Payments | Stripe | Familiar, good DX with webhooks |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AI scoring is inaccurate | Start manual, iterate prompt, add human-in-the-loop override |
| Users won't upload documents | Offer manual entry; show value before requiring upload |
| Monitoring scrapes hit rate limits | Use Bright Data proxy network; throttle politely |
| Low engagement after first use | Send weekly digest emails with new opportunities/alerts |
| Running costs too high for free tier | Limit free tier to 3 assets, no monitoring; cap AI calls |

---

## Success Metrics

- **Activation**: User completes first upload + sees a score
- **Retention**: User returns within 7 days after first score
- **Score Confidence**: >80% of scores accepted (no manual override)
- **Opportunities Found**: Average 2+ actionable recommendations per asset
- **Revenue**: $1k MRR by end of month 3

---

## Immediate Next Steps (Day 1-3)
1. Set up the monorepo (Next.js + Supabase + Tailwind)
2. Build the database schema (migration script)
3. Create the upload form + Supabase Storage integration
4. Wire up a basic scoring prompt with GPT-4o-mini
5. Build the dashboard list view with color-coded score indicators
