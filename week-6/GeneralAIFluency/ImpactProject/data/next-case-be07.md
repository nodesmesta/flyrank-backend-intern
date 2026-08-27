# Next Case Study — Connect to an AI API (BE-07, POST /enrich)

> STATUS: CONFIRMED — the next real piece of work to be added to the
> portfolio. Chosen on August 27, 2026 because it is the freshest completed
> work (Week 6), with full evidence already in the repo.

## The Case Study (three beats, voice-card draft)

### Meta

- Type: Backend · Week 6
- Title: Connect to an AI API — POST /enrich
- Tagline: One endpoint that turns a messy scraped record into clean,
  schema-validated JSON.
- Stack: Express · TypeScript · OpenCode Zen free tier (deepseek-v4-flash-free)
- Source: github.com/nodesmesta/flyrank-backend-intern/tree/main/week-6/BE-07

### Beat 1 — The Problem

The week-5 polite scraper produced a real book corpus, but the records were
not clean enough to trust: descriptions carried duplicated text, some were
truncated, and the catalogue labeled 7 of them with a placeholder category
(`Default`). Fixing that by hand does not scale, and "just call an LLM" is
not an answer — a raw model reply cannot be trusted by code either. The job:
one endpoint that asks a model for a judgement and returns an answer the API
can actually trust.

### Beat 2 — What I Did

Added one endpoint, `POST /enrich`, to the API. It validates the input before
any model call (a rejected request is a model call not paid for), builds the
prompt from a versioned file (`prompts/enrich-v1.md`, treated as code —
reviewed, diffed, versioned), and sends the scraped record as a user message,
never concatenated into the system prompt (OWASP LLM01). The output pipeline
is the same one the scraper used on untrusted pages: parse with a real
brace-matching scanner, validate against a closed-list schema, repair once by
handing the model its own validation error, and if that fails return a clean
422 and quarantine the output — the caller never receives raw model text.
Trustworthiness was the assignment: explicit timeouts, retries that know when
to stop (401/400 never retried; 403s classified by body because the free-tier
gateway masks upstream failures as auth errors), a kill switch, a per-call
cost log, and 8 labeled eval cases from the real corpus.

### Beat 3 — What Came Of It

The eval scored 8/8 (100%) on a healthy provider. The repair retry proved it
was not theatre: a first invalid answer self-corrected to a valid category
when the prompt was tampered to forbid it, and a second tamper correctly
produced 422 + quarantine. The model independently reproduced the scraper's
known findings — `duplicate_text` and `truncated` fired on the exact records
whose descriptions carry the seed-data duplication, and `mismatched_category`
auto-fired on the `Default` records. Cost: 22 calls, $0 on the free tier.
Honest limits surfaced too: the when-unsure rule is too weak (a 256-char
description got a confident guess instead of `other`), temperature 0 is not
deterministic on this provider, and the free tier is flaky — one eval run hit
a 504 mid-outage and a fixture bug, both fixed and rerun clean.

## When it ships to the portfolio

The work is already shipped and verified in `week-6/BE-07/` (all stages done,
eval rerunnable). The case study above needs only the card to be added as the
5th work entry via `how-to-add-next-case.md` steps 4–6 — the reminder for
exactly that is set (below), and the build context
(`data/build-context.md`) means the conversation is already primed.

## Reminder (set)

- **Form:** Google Calendar event, standard `.ics` file ready to import —
  `data/reminder-be07-case-study.ics`
- **Event:** "Add BE-07 case study to portfolio (/work)" — Wed, 2026-09-03
  09:00–09:30 Asia/Jakarta (WIB), popup alarm 1 day before (2026-09-02)
- **Trigger:** add the BE-07 card to `/work` (steps 4–6 of
  `how-to-add-next-case.md`), then re-run the local audit + live verification
- **Evidence:** the `.ics` file above, imported into Google Calendar on
  2026-08-27 and verified visually —
  `data/reminder-screenshot.png`
