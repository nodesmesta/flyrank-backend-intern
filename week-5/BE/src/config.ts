import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// dotenv path pitfall: when run with `tsx week-5/BE/src/index.ts` from the repo
// root, CWD is the root, NOT the script folder. Resolve .env relative to the
// script so we pick up week-5/BE/.env instead of a root .env.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "..", ".env") });

export interface ScrapeConfig {
  baseUrl: string;
  userAgent: string;
  crawlDelayMs: number;
  limit: number;
  dbPath: string;
  jsonlPath: string;
  logEnabled: boolean;
}

function inTaskFolder(...parts: string[]): string {
  return resolve(__dirname, "..", ...parts);
}

export const CONFIG: ScrapeConfig = {
  baseUrl: process.env.SCRAPER_BASE_URL ?? "https://books.toscrape.com",
  userAgent: process.env.SCRAPER_USER_AGENT ??
    "PoliteScraper/1.0 (week-5 BE assignment; contact: jamaludin@example.com)",
  crawlDelayMs: parseInt(process.env.SCRAPER_DELAY_MS ?? "1500", 10),
  limit: parseInt(process.env.SCRAPER_LIMIT ?? "50", 10),
  dbPath: inTaskFolder("books.db"),
  jsonlPath: inTaskFolder("data", "books.jsonl"),
  logEnabled: (process.env.SCRAPER_LOG ?? "1") === "1",
};