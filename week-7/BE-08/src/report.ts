// The report pipeline — week-7/BE-08 "PDF report generator".
//
// Query (SQL aggregation) -> report object -> HTML -> PDF. Stage 2 defines the
// queries and getReportData(); Stage 3 adds the HTML template and the Playwright
// print; Stages 4-5 wire it into the API with store-and-serve + idempotency.
import { getDb } from "./db.js";
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { BE08_DIR } from "./db.js";

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

/** A whole page of HTML — the "template with holes" from the assignment. */
export function renderReportHtml(data: ReportData): string {
  const today = new Date().toISOString().slice(0, 10);

  const topRows = data.top5
    .map(
      (b, i) =>
        `<tr><td>${i + 1}</td><td>${escapeHtml(b.title)}</td><td>${b.rating} ★</td><td class="num">${fmt(
          b.price,
        )}</td></tr>`,
    )
    .join("");

  // The long table — ALL books. Long on purpose: it is what walks off one page
  // and onto the next, which is exactly where the page-break trap hides.
  const allRows = allBooks()
    .map(
      (b) =>
        `<tr><td>${escapeHtml(b.title)}</td><td>${b.rating} ★</td><td class="num">${fmt(b.price)}</td></tr>`,
    )
    .join("");

  const ratingRows = data.perRating
    .map(
      (r) =>
        `<tr><td>${r.rating} ★</td><td class="num">${r.count}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Bookstore report — ${today}</title>
<style>
  @page { margin: 18mm 16mm; }
  body { font-family: "Segoe UI", Roboto, Arial, sans-serif; color: #1f2430;
         font-size: 11px; line-height: 1.45; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .sub { color: #6b7280; margin: 0 0 18px; }
  h2 { font-size: 14px; border-bottom: 2px solid #2563eb; padding-bottom: 4px;
       margin: 22px 0 10px; }
  .cards { display: flex; gap: 12px; margin: 16px 0; }
  .card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
  .card .k { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; }
  .card .v { font-size: 20px; font-weight: 600; margin-top: 2px; }
  table { border-collapse: collapse; width: 100%; font-size: 10.5px; }
  th, td { border: 1px solid #e5e7eb; padding: 5px 9px; text-align: left; }
  thead th { background: #f3f4f6; font-weight: 600; }
  /* The page-break trap: keep a row in one piece, let the header repeat. */
  tr { break-inside: avoid; }
  td.num, th.num { text-align: right; }
  thead { display: table-header-group; }
</style>
</head>
<body>
  <h1>Bookstore sales report</h1>
  <p class="sub">books.toscrape.com catalog snapshot &middot; generated ${today}</p>

  <div class="cards">
    <div class="card"><div class="k">Total books</div><div class="v">${data.totalBooks}</div></div>
    <div class="card"><div class="k">Average price</div><div class="v">${fmt(data.avgPrice)}</div></div>
  </div>

  <h2>Top 5 most expensive books</h2>
  <table>
    <thead><tr><th>#</th><th>Title</th><th class="num">Rating</th><th class="num">Price</th></tr></thead>
    <tbody>${topRows}</tbody>
  </table>

  <h2>Books per star rating</h2>
  <table>
    <thead><tr><th>Rating</th><th class="num">Count</th></tr></thead>
    <tbody>${ratingRows}</tbody>
  </table>

  <h2>All ${data.totalBooks} books</h2>
  <table>
    <thead><tr><th>Title</th><th class="num">Rating</th><th class="num">Price</th></tr></thead>
    <tbody>${allRows}</tbody>
  </table>
</body>
</html>`;
}

export interface BookRow {
  title: string;
  rating: number;
  price: number;
}

export function allBooks(): BookRow[] {
  return getDb()
    .prepare("SELECT title, rating, price FROM books ORDER BY price DESC")
    .all() as BookRow[];
}

/** Render the report HTML to a real PDF with headless Chromium. */
export async function generateReportPdf(outPath: string): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(renderReportHtml(getReportData()));
    await page.pdf({ path: outPath, format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

export const REPORTS_DIR = path.join(BE08_DIR, "reports");
