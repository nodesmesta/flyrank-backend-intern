# FL-05 — Failure Points (recorded honestly)

Same standard as FL-04: real failures, real retries. Screenshots must show the
working calls; these notes explain what did not work and why.

## 1. InvGate blog — navigation only

- URL: https://www.invgate.com/blog/software-asset-management/
- Tool: `scrape_as_markdown`
- Result: returned only the page title ("InvGate - Build a state-of-the-art IT operation"), no article body.
- Diagnosis: same failure mode as FL-04 Run 2. InvGate's HubSpot-hosted blog
  serves content behind client-side rendering that the extractor did not
  resolve; the page is effectively a shell.
- Action: replaced with the OpenLM trends article (source-2), which extracted cleanly.

## 2. ServiceNow blog — dead URL (404)

- URL: https://www.servicenow.com/blogs/software-asset-management.html
- Tool: `scrape_batch` (parallel)
- Result: HTTP "Page not found" (404). The URL no longer exists; not a scrape failure.
- Action: replaced with the Flexera FinOps-for-AI article (source-4), which extracted cleanly.

## 3. General risk: content noise

- Cookie banners, nav menus and footer blocks inflate raw output. Mitigation:
  strip navigation and keep the article body in the saved source files (this is
  the same content-noise failure point logged in FL-04).

## 4. General risk: freshness

- Search-engine relevance is not 100% and vendor pricing/feature pages go stale.
  The batch result that succeeded (Flexera, July 30, 2026) demonstrates the
  pipeline can capture same-week content; stale targets must be re-verified per run.

## Retry outcome

After retries, 3/3 demonstration tasks produced usable output:
- Task 1 (SERP): 9 organic results
- Task 2 (single scrape): OpenLM article, full body
- Task 3 (batch): Zylo article + Flexera article, full bodies
