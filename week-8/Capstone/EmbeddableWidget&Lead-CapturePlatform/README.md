# Week 8 · Capstone — Embeddable Widget & Lead-Capture Platform

**Task:** FlyRank Backend-Track Capstone (Medium–Hard)
**Code repo:** [`nodesmesta/FlyrankCapstoneWidgetPlatform`](https://github.com/nodesmesta/FlyrankCapstoneWidgetPlatform) — a **separate public repository** for the capstone code, per the brief's "never inside a repository that holds other work" rule.
**This folder:** task documentation only — the brief, this note, and a pointer to the code repo.

> The full spec lives in [`Lead-Capture Platform Live Capstone.pdf`](Lead-Capture%20Platform%20Live%20Capstone.pdf) (kept here, mirrored as `BRIEF.pdf` in the code repo). Read that before reviewing the capstone work.

---

## What the capstone builds

A platform where a customer defines an embeddable widget (signup form, contact
form, CTA popover), pastes **one line of `<script>`**, and every visitor
submission travels back to a hardened backend that validates, spam-filters,
geo-enriches (with a provider fallback chain), stores, and surfaces it to the
owner in a dashboard. The public internet is the input — this is a real product
category (Intercom, Mailchimp, HubSpot lead popups).

## Progress (mirrors the code repo's README)

| Phase | What | Status |
|-------|------|--------|
| 1 | Design — widget + submission models, embed flow, API contracts, non-goal | ✅ committed (`docs/design.md`) |
| 2 | Hardened submission path — validation, CORS, rate limit, spam, geo fallback, safe side effect, background enrichment job | ✅ |
| 3 | Delivery (widget.js + cached config), dashboard API, README + EVIDENCE final | ✅ |

All **14 acceptance-probe checks** pass against a live server; the six brief
probes plus background-job enrichment, idempotency, and clean malformed-JSON
errors are proven in the repo's `EVIDENCE.md`.

## Where the work lives

- **Code + design + evidence:** the separate repo → [nodesmesta/FlyrankCapstoneWidgetPlatform](https://github.com/nodesmesta/FlyrankCapstoneWidgetPlatform)
  - `docs/design.md` — Phase 1 design doc
  - `EVIDENCE.md`, `BUILDLOG.md`, `capstone.yaml`, `.env.example` — required capstone files
- **This folder:** the assignment brief (PDF) + this task note only.
