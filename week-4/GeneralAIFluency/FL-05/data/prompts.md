# FL-05 — MCP Tool Call Transcripts

Date: August 1, 2026
Client: Hermes Agent (MCP client) connected to the Bright Data MCP server.
Domain: Asset Management SaaS (same domain as FL-04).

All three tasks were executed through the Bright Data MCP server. Chat alone
could not have done any of them: a plain chat model has no live search access,
no anti-bot page unlock, and no parallel fetch capability.

---

## Task 1 — Live search engine query (SERP)

Tool: `search_engine` (Bright Data MCP)
Call: `mcp__brightdata__search_engine`

```json
{
  "engine": "google",
  "geo_location": "us",
  "query": "software asset management trends 2026 SAM tools"
}
```

Result: 9 organic results returned (page 1). Output saved in
[source-1-serp-results.md](source-1-serp-results.md).

Why chat alone could not do this: real-time Google SERP with geo targeting and
bot protection. A chat model has no network access and cannot return live,
dated search results.

---

## Task 2 — Single-page scrape with anti-bot unlock

Tool: `scrape_as_markdown` (Bright Data MCP)
Call: `mcp__brightdata__scrape_as_markdown`

```json
{
  "url": "https://www.openlm.com/blog/software-asset-management-trends-2026/"
}
```

Result: full article content extracted (title, author, body, FAQ). Output saved
in [source-2-openlm-trends-2026.md](source-2-openlm-trends-2026.md).

Why chat alone could not do this: the page sits behind a JS-heavy marketing
site; extraction required the unlocker to render and return Markdown. The
article (January 2, 2026) is a live 2026 SAM trends source that did not exist
when the model was trained.

---

## Task 3 — Batch scrape of multiple URLs

Tool: `scrape_batch` (Bright Data MCP)
Call: `mcp__brightdata__scrape_batch`

```json
{
  "urls": [
    "https://zylo.com/blog/best-software-asset-management-tools",
    "https://www.flexera.com/blog/ai/5-finops-practices-for-ai/"
  ]
}
```

Result: 2/2 URLs returned full page content in one parallel call. Output saved
in [source-3-zylo-best-sam-tools.md](source-3-zylo-best-sam-tools.md) and
[source-4-flexera-finops-ai.md](source-4-flexera-finops-ai.md).

Why chat alone could not do this: parallel multi-URL retrieval with per-URL
anti-bot handling. The Zylo article (April 9, 2026) compares 10 SAM vendors and
cites the 2026 SaaS Management Index; the Flexera article (July 30, 2026) is a
same-week FinOps-for-AI piece. Both are newer than any training data.

---

## Failed attempts (recorded honestly)

| URL | Tool | Outcome |
| --- | --- | --- |
| https://www.invgate.com/blog/software-asset-management/ | `scrape_as_markdown` | Navigation only — returned just the page title, no body. Same failure mode as FL-04 Run 2. |
| https://www.servicenow.com/blogs/software-asset-management.html | `scrape_batch` | HTTP 404 "Page not found" — dead URL, not a scrape failure. |

These were retried with valid URLs; see [failure-points.md](failure-points.md).
