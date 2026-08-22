# Week 6 · BE-07 — Put an LLM behind your API (POST /enrich)

One new endpoint on the API grown across the program: it takes a scraped book
record from the week-5 corpus (books.toscrape.com), sends the messy parts to an
LLM, and returns clean, schema-validated JSON — with a real timeout, retries
that know when to stop, a cost log and a kill switch. One request in, one
structured answer out. This is not a chatbot.

The assignment's job card lives in [`JOB-CARD.md`](JOB-CARD.md) — the closed
lists, the output contract and the "never" rules are all defined there and
mirrored in code (`src/llm/schema.ts`).

```
validate the input  -> reject garbage before you spend a call
build the prompt    -> from a versioned file
call the model      -> with a timeout, and retries on the right errors only
parse + validate    -> against the output schema
repair once         -> hand the model its own error message
return clean JSON   -> or a clear 422 — never raw model text
```

## Run it

From the repo root (monorepo scripts follow the `:be` convention):

```bash
npm run dev:be6     # watch mode
npm run start:be6   # one-shot
npm run eval:be6    # 8-case eval against http://localhost:3000 (ENRICH_URL overrides)
```

Config lives in `week-6/BE-07/.env` (git-ignored; `.env.example` documents it):
`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_STUB`, `LLM_ENABLED`,
`LLM_TIMEOUT_MS`, `PORT`.

## Endpoint

| Method | Path | Description | Status codes |
|--------|------|-------------|--------------|
| POST | `/enrich` | Enrich one week-5 book record → category (closed list), confidence, one-sentence summary, quality_flags | 200, 400, 422, 502, 504, 503 |
| GET | `/health` | Liveness probe | 200 |

Status meanings: `200` validated schema · `400` invalid input naming the field
(before any model call) · `422` model output rejected twice and quarantined ·
`502` provider failure or retries exhausted on a retryable error · `504` model
call timed out · `503` kill switch (`LLM_ENABLED=false`). The caller never
receives raw model text.

### Valid request (stub mode — `LLM_STUB=1`, zero model calls)

```bash
curl -X POST http://localhost:3000/enrich \
  -H "Content-Type: application/json" \
  -d '{"record":{"title":"A Light in the Attic","description":"It is hard to imagine a world without this now-classic collection of poetry and drawings.","url":"https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html"}}'
```

```json
{"category":"other","confidence":0,"summary":"Stub response: the model was not called because stub mode is on.","quality_flags":[]}
```

### Deliberately broken request (missing field → 400 naming it)

```bash
curl -X POST http://localhost:3000/enrich \
  -H "Content-Type: application/json" \
  -d '{"record":{"description":"no title here","url":"https://x"}}'
```

```json
{"error":"Invalid field \"record.title\": Invalid input: expected string, received undefined"}
```

Input validation runs **before** any model call — every rejected request is a
model call we did not pay for.


## Stage 2 — the prompt is a specification

The prompt lives in a **versioned file**, `prompts/enrich-v1.md` — not in a
string inside the route. It is code: it gets reviewed, diffed, and versioned
(`-v1`). It contains, in order: the role and job, the exact output shape with
the closed lists, the rules, the when-unsure instruction, and three real
corpus examples (typical / mismatch / when-unsure).

The untrusted record content is sent as a **user message**, JSON-encoded —
never concatenated into the system prompt (OWASP LLM01 mitigations; scraped
pages may try to hijack the prompt). Temperature is 0: the same input must
give the same answer.

The model is wired in and its raw text is returned as-is
(`raw_model_output`) — Stage 3 wraps it in parse + validate + repair +
quarantine so the caller only ever receives the validated schema.

### Three real inputs, read with human eyes (2026-08-11)

```json
{"title":"A Light in the Attic","description":"...","declared_category":"Poetry"}
→ {"category":"Poetry","confidence":0.92,"summary":"A 20th-anniversary edition of Shel Silverstein's classic humorous poetry and drawings for children.","quality_flags":["duplicate_text","truncated"]}

{"title":"The Boys in the Boat: Nine Americans and Their Epic Quest for Gold at the 1936 Berlin Olympics","description":"...","declared_category":"Default"}
→ {"category":"Nonfiction","confidence":0.9,"summary":"A dramatic account of the University of Washington crew's quest for Olympic gold at the 1936 Berlin Olympics.","quality_flags":["duplicate_text","truncated","mismatched_category"]}

{"title":"Penny Maybe","description":"...","declared_category":"Default"}
→ {"category":"Young Adult","confidence":0.75,"summary":"A girl in foster care decides to swim Lake Ontario and asks her physics teacher to coach her.","quality_flags":["mismatched_category"]}
```

### What surprised me

- The model **independently reproduced the week-5 scraper findings**:
  `duplicate_text` + `truncated` fired on records whose descriptions genuinely
  carry the seed-data duplication the polite scraper documented. The flags are
  not boilerplate — they match the corpus's known quirks.
- `mismatched_category` fires automatically on the 7 records the site labels
  `Default` — the placeholder category is exactly the case the flag exists for.
- The when-unsure example was **not** followed for `Penny Maybe`: the model
  answered `Young Adult` at 0.75 confidence instead of `other` + low
  confidence. A human grader may agree or prefer `other` — that tension is
  precisely why Stage 5 evals 8 cases instead of trusting one example.


## Stage 3 — make the output trustworthy

The model is an external source; its answer is raw input. Every answer goes
through the same pipeline last week's scraper used for scraped pages:

1. **Parse** — strip the code fence / preamble, find the JSON object with a
   real brace-matching scanner (not regex), `JSON.parse` it.
2. **Validate** — `safeParse` against the output schema. A structurally valid
   object with a category we never allowed is still a failure.
3. **Repair once** — on failure, one more call with the same prompt + the
   broken output + the exact validation error: *"Your previous answer was
   rejected for this reason…"*.
4. **Give up cleanly** — if the second attempt also fails: `422` with a
   readable message, raw output logged to `logs/quarantine.jsonl` (git-ignored,
   snapshot in `data/evidence/`), and the process never crashes.

The caller only ever receives the validated schema — never raw model text.

### Checkpoint: a model that ignores the schema (2026-08-11)

The prompt was temporarily tampered to demand the category `Alien` (reverted
afterwards; `git diff` clean). Result:

```bash
curl -X POST http://localhost:3000/enrich -H "Content-Type: application/json" \
  -d '{"record":{"title":"A Light in the Attic","description":"…","url":"…","category":"Poetry"}}'
```

```json
HTTP 422
{"error":"Model output rejected twice (enrich-v1): category: Invalid option: expected one of \"Poetry\"|\"Nonfiction\"|…|\"other\""}
```

Quarantine line (`logs/quarantine.jsonl`, snapshot in
`data/evidence/quarantine-example-2026-08-11.jsonl`) records the input, both
raw outputs, both validation errors and the prompt version.

### What surprised me

- **The repair retry is not theatre.** During the first (weaker) tamper the
  model's first answer was invalid but the repair pass — which quotes the exact
  validation error, including the list of valid options — got it to
  self-correct to a valid category, and the request returned 200. The repair
  only fails when the prompt actively forbids correction, which is exactly when
  a 422 is the right answer.
- Both attempts took ~10 s each (OpenCode Zen free tier); the 422 checkpoint
  run above took 100 s wall time — two model calls plus SDK-default retries.
  Stage 4 sets explicit timeouts and a retry policy.


## Stage 4 — timeouts, retries, kill switch, cost

### Retry policy (chosen explicitly, not the SDK default)

The openai SDK's own retries are disabled (`maxRetries: 0`) — no silent extra
calls. Our loop retries only the failures worth retrying, with exponential
backoff + jitter (1s, 2s, 4s):

| Failure | Retried? | Why |
|---|---|---|
| timeout (`LLM_TIMEOUT_MS`, default 30000) | yes, 1s/2s/4s + jitter | transient |
| connection error | yes, same backoff | transient |
| `429` rate limit | yes, honours `Retry-After` | transient |
| `5xx` provider error | yes, same backoff | transient |
| `400` / `401` / `403` | **no** | a bad key is still a bad key in four seconds — on a free tier every pointless retry burns quota |
| `403` with an `Upstream request failed` / `server_error` body | yes | the zen gateway masks its own upstream failures as 403 (see surprises) |

### Verified failure paths (all tested 2026-08-11, isolated port 3100)

**Kill switch → 503, zero model calls.** `LLM_ENABLED=false` answers
immediately; the cost log stays untouched:

```bash
$ curl -X POST http://localhost:3000/enrich -H "Content-Type: application/json" -d '{"record":{…}}'
HTTP 503  {"error":"AI enrichment is disabled (LLM_ENABLED=false)"}   # 0.0 s
```

**Bad key → 502, fail fast.** `LLM_API_KEY=dummy` — a 401 is never retried,
one attempt only:

```bash
HTTP 502  {"error":"Model call failed after 1 attempt: 401: 401 Invalid API key."}   # 0.9 s
```

**Timeout → 504.** `LLM_TIMEOUT_MS=100` — four attempts at 100 ms each, backoff
1s/2s/4s between them, then a clean 504:

```bash
HTTP 504  {"error":"Model call timed out after 100 ms (retries exhausted)"}   # 8.3 s
```

### Cost log (`logs/cost.jsonl`, git-ignored; snapshot in `data/evidence/`)

One structured line per model call: prompt version, repair flag, model, input
and output tokens, duration, retries, error. Real sample:

```json
{"ts":"…","prompt_version":"enrich-v1","repair":false,"model":"deepseek-v4-flash-free","input_tokens":1092,"output_tokens":228,"duration_ms":10852,"retries":0,"error":null}
```

### What surprised me

- **The zen free-tier gateway masks upstream failures as 403.** The error text
  is `403 Error from provider (Console): Upstream request failed: [server_error]
  Upstream response was not valid JSON` — a transient provider-side failure
  wearing an auth status. The retry policy classifies by the error *body*, not
  the status code alone: `upstream`/`server_error` 403s are retried, real auth
  403s are not.
- **The free tier is flaky and slow.** One testing hour produced the 403-masked
  failure above and a stretch of full 30s timeouts; the identical request
  succeeded two minutes later in 11 s. The 504 path got exercised for real,
  not just in theory.
- **The model pool changed under us.** `minimax-m2.5-free` and
  `qwen3.6-plus-free` now answer `ModelError: not supported`; only
  `deepseek-v4-flash-free` still works. The three-env-var design
  (`LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`) means swapping models is a
  restart, not a redeploy.


## Stage 5 — evals with real scores

`evals/cases.json` holds 8 labeled cases pulled from the real week-5 corpus:
4 typical records whose declared category matches the content, 1 mismatch
(site declared `Default`), 1 wordless picture book, 1 genuinely ambiguous
biographical novel, and 1 sparse 256-character description (the when-unsure
case). Each case carries the expected category, any accepted alternatives, and
the quality flags a careful human would expect. `npm run eval:be6` posts each
case through the real HTTP endpoint and scores it.

Scoring rule (documented in cases.json): a case passes when the returned
category is the expected one or an accepted alternative; flags and confidence
are reported per case but not scored.

### Run 2 — clean run, 2026-08-11 (prompt enrich-v1, deepseek-v4-flash-free)

```
[PASS] typical-poetry         expected=Poetry           got="Poetry"           conf=0.95 flags=duplicate_text,truncated flagHits=2/2
[PASS] typical-mystery        expected=Mystery          got="Mystery"          conf=0.94 flags=duplicate_text,truncated flagHits=1/1
[PASS] typical-scifi          expected=Science Fiction  got="Science Fiction"  conf=0.93 flags=duplicate_text,truncated flagHits=1/1
[PASS] typical-romance        expected=Romance          got="Romance"          conf=0.94 flags=duplicate_text,truncated flagHits=1/1
[PASS] mismatch-default       expected=Nonfiction       got="Nonfiction"       conf=0.93 flags=duplicate_text,truncated,mismatched_category flagHits=2/2
[PASS] childrens-picture-book expected=Childrens        got="Childrens"        conf=0.90 flags=duplicate_text,truncated flagHits=1/1
[PASS] ambiguous-default      expected=Historical Fiction got="Historical Fiction" conf=0.90 flags=duplicate_text,truncated,mismatched_category flagHits=1/1
[PASS] when-unsure-sparse     expected=other            got="Young Adult"      conf=0.78 flags=mismatched_category flagHits=0/1
EVAL SCORE: 8/8 (100%)
```

### Run 1 — 6/8, and why the two misses were not model failures (2026-08-11)

- `typical-poetry` answered **HTTP 504** — the free tier was mid-outage; the
  identical request passed in Stage 3/4 and passed again in run 2. Infrastructure,
  not judgement.
- `ambiguous-default` answered **HTTP 400** — the corpus record is 3,411 chars
  and the API caps descriptions at 3,000, so our own fixture violated our own
  contract. Fixed: the eval sends the first 3,000 chars (what a real client
  would do) and the case notes it. An eval that 400s on its own fixture is a
  bug in the test, not the model.

The honest takeaway: on a healthy provider the model scored 8/8, and the two
run-1 misses were a provider outage and a test-fixture bug — which is exactly
why evals should be rerunnable and why the runner prints the raw category.

### Cost

Sorted in `logs/cost.jsonl` per model call (snapshot in `data/evidence/`).
Across all test runs: 22 calls, 15 successful, average 1,170 input + 530 output
tokens and 28.3 s per successful call. On this free tier the cash cost is $0.
If the same payloads ran on a paid OpenAI-compatible provider at GPT-4o-mini
class pricing ($0.15/M input, $0.60/M output), 10,000 calls/day would be about
$4.93/day — the whole eval is well under a cent. The repair path doubles the
token cost only when the model misbehaves.

### What I'd fix

- **The when-unsure rule is too weak.** Given a 256-character description the
  model prefers a confident guess (`Young Adult`, conf 0.60–0.78) over the
  prompt's instructed `other` + `sparse_description`. It passes the eval only
  because `Young Adult` is an accepted human answer — but the missing
  `sparse_description` flag is a real miss. The prompt needs a stronger
  when-unsure threshold (e.g. "under ~350 description chars, do not guess").
- **temperature 0 is not deterministic on this provider.** The same case
  returned 0.60 in run 1 and 0.78 in run 2 with identical inputs. A credible
  eval should run each case N times and score the modal answer.
- **The 3,000-char cap rejects 1 of 50 corpus records** (The Coming Woman,
  3,411 chars). The client must truncate; the eval documents this. Raising the
  cap to 5,000 would accept the whole corpus but grows the token bill.
- **The free tier is flaky** (a stretch of 30s+ latencies and one masked
  upstream 403 during testing). The Stage 4 retry policy + 504 path absorbed
  it; a production deployment would want a paid provider or a queue.
