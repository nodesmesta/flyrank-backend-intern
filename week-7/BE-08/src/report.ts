// The report pipeline — week-7/BE-08 "PDF report generator".
//
// Query (SQL aggregation) -> report object -> HTML -> PDF. Stage 2 defines the
// queries and getReportData(); Stage 3 adds the HTML template and the Playwright
// print; Stages 4-5 wire it into the API with store-and-serve + idempotency.
import { getDb } from "./db.js";

export interface ReportData {
  totalBooks: number;
  avgPrice: number;
  top5: { title: string; price: number; rating: number }[];
  perRating: { rating: number; count: number }[];
}

/** "Boring SQL is 80% of reporting" — 200 rows into five numbers. */
export function getReportData(): ReportData {
  const db = getDb();

  const totalBooks = (db.prepare("SELECT COUNT(*) AS c FROM books").get() as { c: number }).c;

  const avgPrice = (
    db.prepare("SELECT ROUND(AVG(price), 2) AS a FROM books").get() as { a: number }
  ).a;

  const top5 = db
    .prepare("SELECT title, price, rating FROM books ORDER BY price DESC LIMIT 5")
    .all() as { title: string; price: number; rating: number }[];

  const perRating = db
    .prepare("SELECT rating, COUNT(*) AS count FROM books GROUP BY rating ORDER BY rating")
    .all() as { rating: number; count: number }[];

  return { totalBooks, avgPrice, top5, perRating };
}
