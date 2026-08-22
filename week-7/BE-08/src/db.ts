// SQLite access — week-7/BE-08 "PDF report generator" (Assignment A8, Option B).
//
// One file report.db lives next to this task folder. The seed script fills the
// books table from the real corpus collected by the week-5 polite scraper
// (books.toscrape.com -> week-5/BE/data/books.jsonl); the API reads it and the
// reports table records the generated artifacts (store the path, not the bytes).
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

// <root>/week-7/BE-08
export const BE08_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const DB_PATH = path.join(BE08_DIR, "report.db");

let db: Database.Database | undefined;

/** Open (once) and ensure both tables exist. Better-sqlite3 is synchronous. */
export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      title  TEXT    NOT NULL,
      price  REAL    NOT NULL,
      rating INTEGER NOT NULL,
      url    TEXT    NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reports (
      id         TEXT    PRIMARY KEY,
      path       TEXT    NOT NULL,
      created_at TEXT    NOT NULL
    );
  `);
  return db;
}
