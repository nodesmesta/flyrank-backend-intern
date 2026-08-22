// Seed script — week-7/BE-08 "PDF report generator" (Stage 1, Option B).
//
// Fills the books table from the real 50-record corpus the week-5 polite
// scraper collected from books.toscrape.com (week-5/BE/data/books.jsonl). As
// the assignment stresses, running it twice must leave ONE clean copy, so the
// script starts by deleting all rows — "safe to run twice".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, BE08_DIR } from "./db.js";

interface BookRecord {
  url: string;
  title: string;
  price: number;
  rating: number;
}

export function loadBooks(): BookRecord[] {
  // <root>/week-5/BE/data/books.jsonl
  const root = path.dirname(path.dirname(BE08_DIR));
  const corpus = path.join(root, "week-5", "BE", "data", "books.jsonl");
  const lines = fs
    .readFileSync(corpus, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  return lines.map((line) => {
    const r = JSON.parse(line) as BookRecord;
    // Keep only the columns the report needs; ignore the rest of the record.
    return {
      url: r.url,
      title: r.title,
      price: r.price,
      rating: r.rating,
    };
  });
}

export function seed(): number {
  const db = getDb();
  const books = loadBooks();

  // "Safe to run twice": drop everything, then insert fresh.
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM books").run();
    const insert = db.prepare(
      "INSERT INTO books (title, price, rating, url) VALUES (?, ?, ?, ?)",
    );
    for (const b of books) insert.run(b.title, b.price, b.rating, b.url);
  });
  tx();

  return books.length;
}

// When run directly (npm run seed:be8), print the count so the checkpoint is
// visible. Importable too (used by the report pipeline's setup note).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const n = seed();
  const count = (getDb().prepare("SELECT COUNT(*) AS c FROM books").get() as { c: number }).c;
  console.log(`seeded ${n} books; SELECT COUNT(*) = ${count}`);
}
