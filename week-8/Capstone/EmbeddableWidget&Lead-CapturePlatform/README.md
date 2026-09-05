# Week 8 · Capstone — Embeddable Widget & Lead-Capture Platform

**Task:** FlyRank Backend-Track Capstone (Medium–Hard)
**Code repo:** [`FlyrankCapstoneWidgetPlatform`](https://github.com/nodesmesta/flyrank-capstone-widget-platform) — a **separate public repository** for the capstone code, per the brief's "never inside a repository that holds other work" rule.
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
| 2 | Hardened submission path — validation, CORS, rate limit, spam, geo fallback, safe side effect | ⏳ next |
| 3 | Delivery (widget.js + cached config), dashboard API, README + EVIDENCE final | ⏳ |

## Where the work lives

- **Code + design + evidence:** the separate repo → [`FlyrankCapstoneWidgetPlatform`](https://github.com/nodesmesta/flyrank-capstone-widget-platform)
  - `docs/design.md` — Phase 1 design doc
  - `EVIDENCE.md`, `BUILDLOG.md`, `capstone.yaml`, `.env.example` — required capstone files
- **This folder:** the assignment brief (PDF) + this task note only.
