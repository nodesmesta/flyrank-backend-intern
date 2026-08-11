# Week 6 · BE — Put an LLM behind your API (POST /enrich)

One new endpoint on the API grown across the program: it takes a scraped book
record from the week-5 corpus (books.toscrape.com), sends the messy parts to an
LLM, and returns clean, schema-validated JSON — with a real timeout, retries
that know when to stop, a cost log and a kill switch. One request in, one
structured answer out. This is not a chatbot.

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
```

Config lives in `week-6/BE/.env` (git-ignored; `.env.example` documents it):
`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_STUB`, `LLM_ENABLED`,
`LLM_TIMEOUT_MS`, `PORT`.

## Endpoint

| Method | Path | Description | Status codes |
|--------|------|-------------|--------------|
| POST | `/enrich` | Enrich one week-5 book record → category (closed list), confidence, one-sentence summary, quality_flags | 200, 400, 501* |
| GET | `/health` | Liveness probe | 200 |

\* The response shape is intermediate: `raw_model_output` in Stage 2; from Stage 3
the caller always receives the validated schema. Final states: 200 / 400 / 422
(unrepairable model output) / 504 (timeout) / 503 (kill switch).

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
