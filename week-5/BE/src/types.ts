/**
 * Shared shapes for the polite-scraper pipeline.
 *
 * Raw* types are what extract.ts pulls straight out of the HTML (still messy).
 * Book is the cleaned, structured record that gets saved to SQLite + JSONL
 * and becomes next week's RAG corpus.
 */
export interface RawBookCard {
  url: string; // absolute URL of the book detail page
  title: string;
  priceText: string; // e.g. "£51.77"
  availabilityText: string; // e.g. "In stock (22 available)"
  ratingWord: string; // "One".."Five"
}

export interface RawBookDetail {
  title: string;
  priceText: string;
  availabilityText: string;
  ratingWord: string;
  category: string | null; // leaf category from the breadcrumb, e.g. "Poetry"
  description: string;
  upc: string | null;
  imageUrl: string; // absolute URL of the cover
  reviewsText: string | null;
}

export interface Book {
  url: string; // canonical absolute detail URL (dedupe key)
  title: string;
  price: number; // GBP, numeric
  inStock: boolean;
  stockCount: number | null;
  rating: number; // 1..5
  category: string;
  upc: string;
  description: string;
  imageUrl: string;
  reviews: number;
  scrapedAt: string; // ISO timestamp of this run
}