import Database from "better-sqlite3";
import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import type { Book } from "./types.js";

export interface Store {
  insert(book: Book): void;
  count(): number;
  close(): void;
}

/**
 * SQLite store + JSONL (RAG corpus), written for one run.
 *
 * - Schema for a book record; `url` is the dedupe PRIMARY KEY.
 * - Each run is FRESH: table is truncated and the JSONL corpus is rewritten,
 *   so the store always mirrors, exactly, the books scraped this run.
 * - JSONL accumulates the Book objects in memory and is flushed atomically on
 *   close() so re-scraping never leaves duplicate lines in the corpus.
 */
export function openStore(dbPath: string, jsonlPath: string): Store {
  mkdirSync(dirname(jsonlPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      url         TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      price       REAL,
      inStock     INTEGER NOT NULL DEFAULT 0,
      stockCount  INTEGER,
      rating      INTEGER,
      category    TEXT,
      upc         TEXT,
      description TEXT,
      imageUrl    TEXT,
      reviews     INTEGER,
      scrapedAt   TEXT
    );
  `);
  db.exec("DELETE FROM books;");

  const upsert = db.prepare(`
    INSERT INTO books
      (url, title, price, inStock, stockCount, rating, category, upc, description, imageUrl, reviews, scrapedAt)
    VALUES
      (@url, @title, @price, @inStock, @stockCount, @rating, @category, @upc, @description, @imageUrl, @reviews, @scrapedAt)
    ON CONFLICT(url) DO UPDATE SET
      title=excluded.title, price=excluded.price, inStock=excluded.inStock,
      stockCount=excluded.stockCount, rating=excluded.rating, category=excluded.category,
      upc=excluded.upc, description=excluded.description, imageUrl=excluded.imageUrl,
      reviews=excluded.reviews, scrapedAt=excluded.scrapedAt
  `);

  const corpus: Book[] = [];
  return {
    insert(book) {
      upsert.run({ ...book, inStock: book.inStock ? 1 : 0 });
      corpus.push(book);
    },
    count() {
      return (db.prepare("SELECT COUNT(*) AS n FROM books").get() as { n: number }).n;
    },
    close() {
      writeFileSync(jsonlPath, corpus.map((b) => JSON.stringify(b)).join("\n") + "\n");
      db.close();
    },
  };
}