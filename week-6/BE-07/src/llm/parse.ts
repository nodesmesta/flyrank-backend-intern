// Stage 3 — make the output trustworthy.
// The model is an external source; its answer is raw input. Every answer goes
// through: parse -> validate -> repair ONCE -> quarantine on failure.
// The endpoint's contract is the schema — never raw model text.
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "./config.js";
import { complete } from "./client.js";
import { PROMPT_VERSION } from "./prompt.js";
import { enrichOutputSchema, type BookRecord, type EnrichOutput } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUARANTINE_PATH = resolve(__dirname, "..", "..", "logs", "quarantine.jsonl");

/** Raised when the model fails twice; the route answers 422, never crashes. */
export class UnrepairableOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnrepairableOutputError";
  }
}

type ParseResult = { output: EnrichOutput } | { error: string };

/**
 * Turn model text into a validated EnrichOutput.
 * Models like to wrap JSON in a code fence or add "Sure! Here's the JSON:"
 * in front — strip the fence, find the object, parse it. A structurally valid
 * object with a category we never allowed is still a failure (safeParse).
 */
export function parseEnrichment(text: string): ParseResult {
  const direct = tryParseJson(text);
  if (!direct.ok) {
    const candidate = extractJsonObject(text);
    if (!candidate) return { error: `No JSON object found in model output. Sample: ${text.slice(0, 160)}` };
    const c = tryParseJson(candidate);
    if (!c.ok) return { error: `Extracted candidate is not valid JSON: ${c.error}` };
    return validateOutput(c.value);
  }
  return validateOutput(direct.value);
}

function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Extract a JSON object using a real brace-matching scanner that understands
 * strings and escape sequences (unlike greedy regex, which silently truncates
 * nested objects or quoted braces). Proven on FL-07's classifier.
 */
function extractJsonObject(text: string): string | null {
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{") continue;
    const end = braceMatchEnd(text, i);
    if (end === -1) continue;
    const candidate = text.slice(i, end + 1);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      continue; // not the object we want; keep scanning
    }
  }
  return null;
}

function braceMatchEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function validateOutput(raw: unknown): ParseResult {
  const r = enrichOutputSchema.safeParse(raw);
  if (r.success) return { output: r.data };
  const first = r.error.issues[0];
  return { error: `${first.path.join(".") || "(root)"}: ${first.message}` };
}

/**
 * Run the job with exactly one repair retry:
 *   1. call the model, parse + validate
 *   2. on failure, call ONCE more with the same prompt + broken output + the
 *      exact validation error ("Your previous answer was rejected for this
 *      reason...")
 *   3. if the second attempt also fails, quarantine the raw output and throw —
 *      never crash, never guess a default and pretend it worked.
 */
export async function enrichWithRepair(
  cfg: Config,
  system: string,
  user: string,
  record: BookRecord,
): Promise<EnrichOutput> {
  const meta = { promptVersion: PROMPT_VERSION, repair: false };
  const first = await complete(cfg, system, user, meta);
  const r1 = parseEnrichment(first);
  if ("output" in r1) return r1.output;

  const repairUser =
    `${user}\n\nYour previous answer was rejected for this reason: ${r1.error}\n` +
    "Return only corrected JSON matching the schema. Do not add commentary.";
  const second = await complete(cfg, system, repairUser, { ...meta, repair: true });
  const r2 = parseEnrichment(second);
  if ("output" in r2) return r2.output;

  quarantine(record, first, second, r1.error, r2.error);
  throw new UnrepairableOutputError(
    `Model output rejected twice (${PROMPT_VERSION}): ${r2.error}`,
  );
}

function quarantine(
  record: BookRecord,
  firstOutput: string,
  secondOutput: string,
  firstError: string,
  secondError: string,
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    prompt_version: PROMPT_VERSION,
    input: { title: record.title, description: record.description, declared_category: record.category ?? null },
    errors: { first: firstError, second: secondError },
    raw_outputs: { first: firstOutput, second: secondOutput },
  });
  mkdirSync(dirname(QUARANTINE_PATH), { recursive: true });
  appendFileSync(QUARANTINE_PATH, `${line}\n`);
}
