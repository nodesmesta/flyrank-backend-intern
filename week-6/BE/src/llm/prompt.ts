// The prompt is a specification: it lives in a versioned FILE (prompts/
// enrich-v1.md), not in a string inside the route — it goes through code
// review and can be diffed when the quality changes.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { BookRecord } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, "..", "..", "prompts", "enrich-v1.md");

export const PROMPT_VERSION = "enrich-v1";

export function loadSystemPrompt(): string {
  return readFileSync(PROMPT_PATH, "utf-8");
}

/**
 * Untrusted content stays in the USER message — never glued into the system
 * prompt — and is JSON-encoded so it cannot break out of its own quotes.
 * These are the two cheap OWASP LLM01 mitigations; scraped pages may contain
 * text designed to hijack the prompt ("ignore your previous instructions...").
 */
export function buildUserMessage(record: BookRecord): string {
  return JSON.stringify({
    title: record.title,
    description: record.description,
    declared_category: record.category ?? null,
  });
}
