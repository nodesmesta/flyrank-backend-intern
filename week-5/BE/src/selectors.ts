/**
 * Centralized site structure — the ONLY place CSS selectors live.
 *
 * Keeping the selectors in one module (not scattered across extract.ts) makes
 * it trivial to re-point the scraper at a different site later: change this
 * block, not the extraction logic. Books to Scrape is the chosen practice site.
 */
export const SITE_NAME = "books.toscrape.com";

const RATING_WORDS = ["One", "Two", "Three", "Four", "Five"] as const;

export const SELECTORS = {
  /** a single book card on a listing page */
  listingCard: "article.product_pod",
  cardTitleLink: "h3 a",
  cardPrice: "p.price_color",
  cardAvailability: "p.instock.availability",
  cardRating: "p.star-rating",

  /** "next" pagination link */
  nextPage: "li.next > a",

  /** the product block on a detail page (a <div> in books.toscrape.com) */
  detailMain: "div.product_main",
  detailTitle: "h1",
  detailPrice: "p.price_color",
  detailAvailability: "p.instock.availability",
  detailRating: "p.star-rating",
  detailGalleryImage: "#product_gallery img",
  breadcrumbActive: "ul.breadcrumb > li.active",
  breadcrumbSibling: "li",
  descriptionBlock: "#product_description",
  infoTable: "table.table-striped",
  infoRow: "tr",
  infoKey: "th",
  infoValue: "td",
} as const;

export { RATING_WORDS };