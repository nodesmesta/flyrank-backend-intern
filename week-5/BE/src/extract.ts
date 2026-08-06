import * as cheerio from "cheerio";
import type { RawBookCard, RawBookDetail } from "./types.js";
import { SELECTORS, RATING_WORDS } from "./selectors.js";

function abs(href: string | undefined, baseUrl: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return undefined;
  }
}

/** Pull the One..Five word out of a star-rating element's class list. */
function ratingWordFromClass(className: string | undefined): string {
  const words = (className ?? "").split(/\s+/);
  return words.find((c) => (RATING_WORDS as readonly string[]).includes(c)) ?? "";
}

/** Collapse internal whitespace and trim — applied to every text field we save. */
export function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Extract every book card from a catalogue listing page.
 * Selectors come from ./selectors.js — the single place site structure lives.
 */
export function parseCards(html: string, baseUrl: string): RawBookCard[] {
  const $ = cheerio.load(html);
  const cards: RawBookCard[] = [];
  $(SELECTORS.listingCard).each((_, el) => {
    const $card = $(el);
    const link = $card.find(SELECTORS.cardTitleLink).first();
    const detailUrl = abs(link.attr("href"), baseUrl);
    if (!detailUrl) return;
    cards.push({
      url: detailUrl,
      title: link.attr("title") ?? link.text().trim(),
      priceText: $card.find(SELECTORS.cardPrice).first().text().trim(),
      availabilityText: normalizeText($card.find(SELECTORS.cardAvailability).first().text()),
      ratingWord: ratingWordFromClass($card.find(SELECTORS.cardRating).attr("class")),
    });
  });
  return cards;
}

/** URL of the "next" page link on a listing page, or null at the last page. */
export function nextPageHref(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  const href = $(SELECTORS.nextPage).attr("href");
  return href ? abs(href, baseUrl) ?? null : null;
}

/**
 * Extract fields from one book detail page.
 * Verified against a live snapshot of
 * https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html
 */
export function parseDetail(html: string, baseUrl: string): RawBookDetail {
  const $ = cheerio.load(html);
  const main = $(SELECTORS.detailMain);

  // leaf category = the breadcrumb <li> just before the active one
  const categoryEl = $(SELECTORS.breadcrumbActive)
    .prev(SELECTORS.breadcrumbSibling)
    .find("a");
  const category = categoryEl.text().trim() || null;

  // description is the <p> that immediately follows the #product_description block
  const description = normalizeText(
    $(SELECTORS.descriptionBlock).nextAll("p").first().text(),
  );

  // key/value rows in the Product Information table
  const info: Record<string, string> = {};
  $(SELECTORS.infoTable).find(SELECTORS.infoRow).each((_, tr) => {
    const $tr = $(tr);
    const key = $tr.find(SELECTORS.infoKey).first().text().replace(/\s+/g, " ").trim().toLowerCase();
    const val = $tr.find(SELECTORS.infoValue).first().text().trim();
    if (key) info[key] = val;
  });

  const imageSrc = $(SELECTORS.detailGalleryImage).attr("src");

  return {
    title: main.find(SELECTORS.detailTitle).first().text().trim(),
    priceText: main.find(SELECTORS.detailPrice).first().text().trim(),
    availabilityText: normalizeText(main.find(SELECTORS.detailAvailability).first().text()),
    ratingWord: ratingWordFromClass(main.find(SELECTORS.detailRating).attr("class")),
    category,
    description,
    upc: info["upc"] ?? null,
    imageUrl: abs(imageSrc, baseUrl) ?? "",
    reviewsText: info["number of reviews"] ?? null,
  };
}