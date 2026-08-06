import { CONFIG } from "./config.js";
import { PoliteFetcher } from "./polite.js";
import { parseCards, parseDetail, nextPageHref } from "./extract.js";
import { toBook, isValidBook } from "./clean.js";
import { openStore } from "./store.js";
import type { RawBookCard } from "./types.js";

/**
 * The polite-scraper orchestrator:
 *   polite fetch (robots + UA + rate-limit) →
 *   walk listing pages collecting cards (dedupe by url, capped by `limit`) →
 *   fetch each detail page → clean into a Book → store to SQLite + JSONL.
 *
 * Skipped books (robots-blocked detail, HTTP error, or failing validation) are
 * printed, not saved. Each run is a fresh corpus (store truncates on open).
 */
async function collectListingCards(
  polite: PoliteFetcher,
  limit: number,
): Promise<RawBookCard[]> {
  const cards: RawBookCard[] = [];
  const seen = new Set<string>();
  let pageUrl: string | null = new URL("/", CONFIG.baseUrl).toString();

  while (pageUrl !== null && cards.length < limit) {
    const html = await polite.fetch(pageUrl);
    if (!html) {
      console.log("[crawl] listing fetch blocked/empty:", pageUrl);
      break;
    }
    // resolve relative links against the page we actually loaded
    const pageCards = parseCards(html, pageUrl);
    for (const card of pageCards) {
      if (seen.has(card.url)) continue;
      seen.add(card.url);
      cards.push(card);
      if (cards.length >= limit) break;
    }
    if (cards.length >= limit) break;
    pageUrl = nextPageHref(html, pageUrl);
  }
  return cards;
}

async function main(): Promise<void> {
  const polite = new PoliteFetcher(CONFIG);
  const policy = await polite.loadRobots();
  console.log(`[crawl] robots present: ${policy.present} | ${policy.note}`);
  console.log(`[crawl] UA: ${CONFIG.userAgent}`);
  console.log(`[crawl] delay ms: ${CONFIG.crawlDelayMs} | limit: ${CONFIG.limit}`);
  console.log(`[crawl] db: ${CONFIG.dbPath}`);
  console.log(`[crawl] jsonl: ${CONFIG.jsonlPath}`);

  const store = openStore(CONFIG.dbPath, CONFIG.jsonlPath);
  const cards = await collectListingCards(polite, CONFIG.limit);
  console.log(`[crawl] collected ${cards.length} unique listing cards`);

  const scrapedAt = new Date().toISOString();
  let saved = 0;
  let skipped = 0;

  for (const card of cards) {
    const html = await polite.fetch(card.url);
    if (!html) {
      skipped++;
      console.log(`[skip] detail blocked/failed: ${card.url}`);
      continue;
    }
    const detail = parseDetail(html, card.url); // resolve image/links against this page
    const book = toBook(card, detail, scrapedAt);
    if (!book || !isValidBook(book)) {
      skipped++;
      console.log(`[skip] invalid book: ${card.url}`);
      continue;
    }
    store.insert(book);
    saved++;
    if (CONFIG.logEnabled && saved % 25 === 0) {
      console.log(`[crawl] ${saved}/${cards.length} saved`);
    }
  }

  const total = store.count();
  store.close();
  console.log(`[done] saved=${saved} skipped=${skipped} rows_in_db=${total}`);
  console.log(`[done] jsonl corpus -> ${CONFIG.jsonlPath}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});