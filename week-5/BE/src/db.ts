import Database from "better-sqlite3";
import { readFileSync, existsSync } from "fs";
import { CONFIG } from "./config.js";

/**
 * Read-only inspection of a completed scrape (npm run db:be5):
 *   row count + url uniqueness, price stats, category & rating distributions,
 *   a sample, and JSONL corpus integrity (line count, unique urls, malformed).
 */

const db = new Database(CONFIG.dbPath, { readonly: true });

console.log(`db: ${CONFIG.dbPath}`);
const { n } = db.prepare("SELECT COUNT(*) AS n FROM books").get() as { n: number };
const { d } = db.prepare("SELECT COUNT(DISTINCT url) AS d FROM books").get() as { d: number };
console.log(`rows: ${n} | distinct urls: ${d} | duplicates: ${n - d}`);

const price = db
  .prepare("SELECT MIN(price) AS min, ROUND(AVG(price), 2) AS avg, MAX(price) AS max FROM books")
  .get() as { min: number; avg: number; max: number };
console.log(`price: min £${price.min} | avg £${price.avg} | max £${price.max}`);

console.log("\nbooks per category:");
for (const r of db
  .prepare("SELECT category, COUNT(*) AS c FROM books GROUP BY category ORDER BY c DESC")
  .all() as Array<{ category: string; c: number }>) {
  console.log(`  ${String(r.category).padEnd(24)} ${r.c}`);
}

console.log("\nrating distribution:");
for (const r of db
  .prepare("SELECT rating, COUNT(*) AS c FROM books GROUP BY rating ORDER BY rating")
  .all() as Array<{ rating: number; c: number }>) {
  console.log(`  ${r.rating} stars: ${r.c}`);
}

const sample = db
  .prepare(
    "SELECT title, price, inStock, stockCount, rating, category, upc FROM books ORDER BY title LIMIT 5",
  )
  .all() as Array<Record<string, unknown>>;

console.log("\nsample (first 5 by title):");
for (const row of sample) {
  const fmt = (v: unknown) => (v === null ? "null" : `${v}`);
  console.log(
    `  - ${fmt(row.title).padEnd(24)} | £${fmt(row.price)} | inStock=${fmt(row.inStock)} | stock=${fmt(row.stockCount)} | rating=${fmt(row.rating)} | ${fmt(row.category)}`,
  );
}
db.close();

// JSONL corpus integrity
if (existsSync(CONFIG.jsonlPath)) {
  const lines = readFileSync(CONFIG.jsonlPath, "utf8").trim().split("\n").filter(Boolean);
  const parsed = lines.map((l) => JSON.parse(l) as { url?: string; title?: string; price?: number });
  const urls = new Set(parsed.map((b) => b.url).filter(Boolean));
  const malformed = parsed.filter((b) => !b.url || !b.title || typeof b.price !== "number").length;
  console.log(`\njsonl: ${CONFIG.jsonlPath}`);
  console.log(`  lines: ${lines.length} | unique urls: ${urls.size} | malformed: ${malformed}`);
} else {
  console.log(`\njsonl: ${CONFIG.jsonlPath} (not found — run scrape:be5 first)`);
}