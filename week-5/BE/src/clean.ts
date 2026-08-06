import type { RawBookCard, RawBookDetail, Book } from "./types.js";
import { normalizeText } from "./extract.js";

/**
 * Clean + structure: turn the messy Raw* shapes into one normalized `Book`.
 *
 * Deliberately deterministic and dependency-free: no regex soup, no heuristics.
 * Each value is a small, testable transformation. Records that fail validation
 * (missing title or parseable price) are rejected with undefined so the
 * orchestrator can skip them instead of saving half-formed rows.
 */

/** "£51.77" → 51.77; "1,299.00" → 1299; anything unparseable → null. */
export function parsePrice(priceText: string | undefined | null): number | null {
  if (!priceText) return null;
  const n = Number(priceText.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && priceText.length > 0 ? n : null;
}

/** "In stock (22 available)" → { inStock: true, stockCount: 22 }. */
export function parseStock(
  availabilityText: string | undefined | null,
): { inStock: boolean; stockCount: number | null } {
  const text = (availabilityText ?? "").toLowerCase();
  const inStock = text.includes("in stock");
  const m = /(\d+)/.exec(text);
  const stockCount = m ? Number(m[1]) : null;
  return { inStock, stockCount };
}

const RATING_MAP: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

/** "Three" / "three" → 3; unknown/empty → 0. */
export function parseRating(ratingWord: string | undefined | null): number {
  return RATING_MAP[(ratingWord ?? "").toLowerCase()] ?? 0;
}

/** "0" → 0; non-numeric → 0. */
export function parseReviews(reviewsText: string | undefined | null): number {
  const n = Number((reviewsText ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** True when a book has enough to be stored (title + numeric price). */
export function isValidBook(book: Book): boolean {
  return book.title.length > 0 && Number.isFinite(book.price) && book.price >= 0;
}

/**
 * Merge a listing card + its detail page into one structured Book.
 * detail is treated as the richer source; card is the fallback for title.
 */
export function toBook(
  card: RawBookCard,
  detail: RawBookDetail,
  scrapedAt: string,
): Book | undefined {
  const title = normalizeText(detail.title || card.title);
  const price = parsePrice(detail.priceText || card.priceText);
  if (!title || price === null) return undefined;

  const stock = parseStock(detail.availabilityText || card.availabilityText);
  return {
    url: card.url,
    title,
    price,
    inStock: stock.inStock,
    stockCount: stock.stockCount,
    rating: parseRating(detail.ratingWord),
    category: detail.category ?? "",
    upc: detail.upc ?? "",
    description: normalizeText(detail.description),
    imageUrl: detail.imageUrl,
    reviews: parseReviews(detail.reviewsText),
    scrapedAt,
  };
}