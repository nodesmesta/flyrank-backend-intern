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

\* 501 is only the Stage-1 state — the model call is wired in Stage 2; the final
states are 200 / 400 / 422 (unrepairable model output) / 504 (timeout) / 503
(kill switch).

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
