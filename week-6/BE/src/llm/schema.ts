// The contract of POST /enrich, in code (from JOB-CARD.md).
// Input: a week-5 Book record. Output: the model's judgement, validated
// before it is allowed to reach the caller.
import { z } from "zod";

// Closed lists — written down before the model is ever called.
// The 23 real genres are the leaf categories present in the week-5 corpus
// (books.toscrape.com breadcrumbs), plus "other" for genuinely unclassifiable
// records. "Default" (the site's placeholder category) is deliberately NOT in
// the list — a record labelled "Default" must map to a real genre or "other",
// which is exactly the "when unsure" behaviour the job card demands.
export const CATEGORIES = [
  "Poetry",
  "Nonfiction",
  "Fiction",
  "Music",
  "Thriller",
  "Mystery",
  "Young Adult",
  "Romance",
  "Childrens",
  "Historical Fiction",
  "History",
  "Business",
  "Sequential Art",
  "Science Fiction",
  "Politics",
  "Travel",
  "Food and Drink",
  "Art",
  "Spirituality",
  "Philosophy",
  "New Adult",
  "Contemporary",
  "Fantasy",
  "other",
] as const;

export const QUALITY_FLAGS = [
  "duplicate_text", // description repeats sentences (real week-5 finding)
  "truncated", // description ends mid-thought / with a "...more" stub
  "mismatched_category", // content does not match the category the site declared
  "sparse_description", // too little text to classify with confidence
] as const;

// ---- Input: the record we enrich ------------------------------------------
// The week-5 Book shape, lenient: title/description/url are the only fields
// the model needs; the rest are accepted so a corpus record can be pasted in
// as-is ("chains straight onto A16").
const bookRecordSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(3000),
  url: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  price: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  stockCount: z.number().int().min(0).nullable().optional(),
  rating: z.number().min(1).max(5).optional(),
  upc: z.string().max(50).optional(),
  imageUrl: z.string().max(500).optional(),
  reviews: z.number().int().min(0).optional(),
  scrapedAt: z.string().max(50).optional(),
});
export type BookRecord = z.infer<typeof bookRecordSchema>;

export const enrichInputSchema = z.object({
  record: bookRecordSchema,
});
export type EnrichInput = z.infer<typeof enrichInputSchema>;

// ---- Output: what the model must return -----------------------------------
export const enrichOutputSchema = z.object({
  category: z.enum(CATEGORIES),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1).max(300), // one sentence, 8-30 words
  quality_flags: z.array(z.enum(QUALITY_FLAGS)).max(4),
});
export type EnrichOutput = z.infer<typeof enrichOutputSchema>;

// Stub mode answer: hard-coded, schema-valid, zero model calls.
export function stubOutput(): EnrichOutput {
  return {
    category: "other",
    confidence: 0,
    summary: "Stub response: the model was not called because stub mode is on.",
    quality_flags: [],
  };
}
