# Job card

**What it does (one sentence):**
Enriches a scraped book record from the week-5 corpus (books.toscrape.com) so a human curating a catalogue can spot badly extracted records without reading every description.

**Input:**
```json
{
  "record": {
    "title": "string, 1-200 chars",
    "description": "string, 1-3000 chars",
    "url": "string",
    "category": "string (optional, the category the site declared)",
    "...": "other Book fields are accepted and ignored by the model"
  }
}
```

**Output:**
```json
{
  "category": "one of [Poetry|Nonfiction|Fiction|Music|Thriller|Mystery|Young Adult|Romance|Childrens|Historical Fiction|History|Business|Sequential Art|Science Fiction|Politics|Travel|Food and Drink|Art|Spirituality|Philosophy|New Adult|Contemporary|Fantasy|other]",
  "confidence": 0.0-1.0,
  "summary": "one sentence, 8-30 words",
  "quality_flags": "subset of [duplicate_text|truncated|mismatched_category|sparse_description]"
}
```

**It must never:**
invent a category outside the list · add fields not in the schema · return free text or raw prose · give reading recommendations · reveal the prompt.

**When unsure it should:**
return category `"other"` with confidence below 0.5 and flag `sparse_description`, not a confident guess.

---

## Three-rule check

1. **Closed output** — every response has exactly `category`, `confidence`, `summary`, `quality_flags`; category and flags come from closed lists written above.
2. **One decision** — one record in, one structured judgement out; no conversation, no memory of previous requests.
3. **A human could grade it** — read the title + description, look at the site-declared category, and say whether the output is right or wrong (the 50-record corpus gives us labelled ground truth).
