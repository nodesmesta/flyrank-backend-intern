import { loadConfig } from "./config.js";
import { BrightData } from "./brightdata.js";
import { classify } from "./classifier.js";
import { logEvent, readAssets, sleep, writeReports } from "./report.js";
import type { SerpResult } from "./brightdata.js";

const TODAY = new Date().toISOString().slice(0, 10);

interface Finding {
  title: string;
  url: string;
  snippet: string;
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const assetsFile = readAssets(cfg.assetInput);
  if (assetsFile.assets.length === 0) {
    console.error("No assets registered in", cfg.assetInput);
    process.exit(1);
  }

  logEvent(cfg.logFile, {
    event: "session_start",
    run: "scripted-v1",
    agent: "Asset Signal Scout (FL-07 src/agent.ts)",
    assets: assetsFile.assets.map((a) => ({ name: a.name, status: a.status })),
  });

  const data = new BrightData(cfg.brightMcpUrl);
  await data.connect();
  console.log("[scout] Bright Data MCP connected");
  logEvent(cfg.logFile, { event: "tool_connection", tool: "Bright Data MCP (search_engine, scrape_as_markdown)" });

  try {
    for (const asset of assetsFile.assets) {
      console.log(`\n[scout] asset: ${asset.name} (status: ${asset.status})`);

      // ---- 1. targeted market queries ------------------------------------
      const queries = buildQueries(asset);
      const findings: Finding[] = [];

      for (const q of queries) {
        console.log(`[scout] search: "${q}"`);
        logEvent(cfg.logFile, { event: "query", query: q, engine: "google" });
        try {
          let serp = await data.search(q, "google");
          await sleep(cfg.rateLimitMs);
          let retried = false;
          if ((serp.organic ?? []).length === 0) {
            console.log("       -> empty on google, retrying bing");
            logEvent(cfg.logFile, { event: "query_empty", query: q, engine: "google", retry_engine: "bing" });
            serp = await data.search(q, "bing");
            await sleep(cfg.rateLimitMs);
            retried = true;
          }
          collect(serp.organic ?? [], findings);
          logEvent(cfg.logFile, { event: "query_result", query: q, engine: retried ? "bing" : "google", organic: (serp.organic ?? []).length });
        } catch (err) {
          // non-JSON reply or transport error — retry once on bing, then move on
          console.warn(`       -> google failed (${(err as Error).message}), retrying bing`);
          logEvent(cfg.logFile, { event: "query_error", query: q, engine: "google", error: (err as Error).message, retry_engine: "bing" });
          try {
            const serp = await data.search(q, "bing");
            await sleep(cfg.rateLimitMs);
            collect(serp.organic ?? [], findings);
            logEvent(cfg.logFile, { event: "query_result", query: q, engine: "bing", organic: (serp.organic ?? []).length });
          } catch (err2) {
            console.warn(`       -> bing also failed: ${(err2 as Error).message}`);
            logEvent(cfg.logFile, { event: "query_error", query: q, engine: "bing", error: (err2 as Error).message, exhausted: true });
          }
        }
      }

      // ---- 2. Scrape the most promising pages ------------------------------
      const top = pickTop(findings, 3);
      console.log(`[scout] verifying ${top.length} promising page(s) with scrape_as_markdown`);
      for (const f of top) {
        try {
          console.log(`[scout] scrape: ${f.url}`);
          const md = await data.scrape(f.url);
          await sleep(cfg.rateLimitMs);
          const cleaned = md.replace(/\s+/g, " ").slice(0, 1200);
          findings.push({ title: `[page] ${f.title}`, url: f.url, snippet: cleaned });
          logEvent(cfg.logFile, { event: "page_scraped", url: f.url, chars: md.length });
        } catch (err) {
          console.warn(`       -> scrape failed: ${(err as Error).message}`);
          logEvent(cfg.logFile, { event: "scrape_error", url: f.url, error: (err as Error).message });
        }
      }

      // ---- 3. LLM classification -------------------------------------------
      const assetContext = `${asset.name} (${asset.type}) — status: ${asset.status}. ${asset.status_notes ?? ""}`;
      const findingsText = findings
        .map((f, i) => `[${i + 1}] ${f.title}\nURL: ${f.url}\n${f.snippet}`)
        .join("\n\n---\n\n");

      console.log(`[scout] classifying ${findings.length} findings via ${cfg.llmModel}…`);
      const classification = await classify(cfg.llmBaseUrl, cfg.llmApiKey, cfg.llmModel, assetContext, findingsText);

      for (const s of classification.signals) {
        console.log(`       ${s.klass.padEnd(11)} ${s.signal}`);
      }
      logEvent(cfg.logFile, { event: "signals", kept: classification.signals.length, signals: classification.signals });
      logEvent(cfg.logFile, { event: "classification_done", recommendation: classification.recommendation });

      // ---- 4. Write reports --------------------------------------------------
      const mdPath = `${cfg.reportDir}/report-${TODAY}.md`;
      const jsonPath = `${cfg.reportDir}/signals-${TODAY}.json`;
      writeReports({ mdPath, signalsJsonPath: jsonPath }, TODAY, asset, classification);
      console.log(`[scout] report written: ${mdPath}`);
      logEvent(cfg.logFile, { event: "report_written", path: mdPath, signals: classification.signals.length });
    }
  } finally {
    await data.close();
  }
  console.log("[scout] done");
}

function buildQueries(asset: { type: string; status: string }): string[] {
  const year = new Date().getFullYear();
  if (asset.type === "precious-metal") {
    return [
      `gold price per gram today trend ${year}`,
      `ways to earn yield on idle physical gold options`,
      `risks of holding physical gold ${year} downside`,
    ];
  }
  return [
    `${asset.type} market trend ${year}`,
    `options to put idle ${asset.type} to work`,
    `risks holding ${asset.type} ${year}`,
  ];
}

function collect(results: SerpResult[], out: Finding[]): void {
  for (const r of results) {
    if (!r.link) continue;
    // Bright Data SERPs sometimes contain relative /goto?url=… proxy links
    // (e.g. from Bing) — those are useless to scrape; drop them here.
    if (!/^https?:\/\//.test(r.link)) continue;
    out.push({ title: r.title ?? "(untitled)", url: r.link, snippet: r.description ?? "" });
  }
}

function pickTop(findings: Finding[], n: number): Finding[] {
  // heuristic: prefer entries with a snippet and a plausible domain, dedupe by url
  const seen = new Set<string>();
  const scored = findings.filter((f) => {
    if (seen.has(f.url)) return false;
    seen.add(f.url);
    return true;
  });
  return scored.slice(0, n);
}

main().catch((err: unknown) => {
  console.error("[scout] fatal:", (err as Error).message);
  process.exit(1);
});
