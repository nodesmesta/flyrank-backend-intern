// The LLM client — Stage 4: real timeout, explicit retry policy, cost logging.
//
// One OpenAI-compatible client for any provider — base URL, key and model are
// the only differences (three env vars, never hard-coded).
//
// OpenCode Zen free tier refuses a non-empty dummy key (401) and accepts no
// auth at all, while the openai SDK demands a non-empty apiKey at construction.
// So: satisfy the constructor, then strip the Authorization header via a custom
// fetch unless a real key is configured (the FL-07 pattern: only send a key
// when one exists).
//
// Retry policy (chosen explicitly, README documents it):
//   - the SDK's own retries are disabled (maxRetries: 0) — we do not want two
//     silent extra calls nobody accounted for
//   - WE retry only on timeouts, connection errors, 429 and 5xx, with
//     exponential backoff + jitter (1s, 2s, 4s), honouring Retry-After on 429
//   - we NEVER retry 400, 401 or 403 — a bad key is still a bad key in four
//     seconds, and on a metered free tier every pointless retry burns quota
import OpenAI, { APIError, APIConnectionError, APIConnectionTimeoutError } from "openai";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COST_LOG_PATH = resolve(__dirname, "..", "..", "logs", "cost.jsonl");

const MAX_ATTEMPTS = 4; // first try + 3 retries (1s, 2s, 4s + jitter)
const BACKOFF_MS = [1000, 2000, 4000];
const JITTER_MS = 500;

/** A model call that ran out of time — the route answers 504. */
export class LlmTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Model call timed out after ${timeoutMs} ms (retries exhausted)`);
    this.name = "LlmTimeoutError";
  }
}

/** Retries exhausted on a retryable failure (429/5xx/network) — route answers 502. */
export class LlmRetriesExhaustedError extends Error {
  constructor(cause: string, attempts: number) {
    super(`Model call failed after ${attempts} attempt${attempts === 1 ? "" : "s"}: ${cause}`);
    this.name = "LlmRetriesExhaustedError";
  }
}

export function makeClient(cfg: Config): OpenAI {
  return new OpenAI({
    baseURL: cfg.llmBaseUrl,
    apiKey: cfg.llmApiKey || "unused",
    // The SDK defaults are wrong for an HTTP endpoint (10-minute timeout, 2
    // silent retries). We set both explicitly: our timeout, our retry loop.
    timeout: cfg.llmTimeoutMs,
    maxRetries: 0,
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      if (cfg.llmApiKey) headers.set("Authorization", `Bearer ${cfg.llmApiKey}`);
      else headers.delete("Authorization");
      return fetch(url, { ...init, headers });
    },
  });
}

export interface CallMeta {
  promptVersion: string;
  repair: boolean;
}

/**
 * One logical model call: temperature 0 (same input, same answer), with the
 * retry policy above. Writes one structured cost log line per call: prompt
 * version, model, token counts, duration, retries, whether it was a repair.
 */
export async function complete(cfg: Config, system: string, user: string, meta: CallMeta): Promise<string> {
  const client = makeClient(cfg);
  const started = Date.now();
  let retries = 0;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: cfg.llmModel,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0,
      });
      const content = res.choices[0]?.message?.content ?? "";
      if (!content.trim()) {
        throw new Error("LLM returned empty content");
      }
      logCost(cfg, meta, {
        inputTokens: res.usage?.prompt_tokens ?? null,
        outputTokens: res.usage?.completion_tokens ?? null,
        durationMs: Date.now() - started,
        retries,
        error: null,
      });
      return content;
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS - 1) break;
      await sleep(getDelayMs(err, attempt));
      retries++;
    }
  }

  const errorText = lastError instanceof Error ? lastError.message : String(lastError);
  logCost(cfg, meta, {
    inputTokens: null,
    outputTokens: null,
    durationMs: Date.now() - started,
    retries,
    error: errorText,
  });

  if (lastError instanceof APIConnectionTimeoutError) {
    throw new LlmTimeoutError(cfg.llmTimeoutMs);
  }
  if (lastError instanceof APIError) {
    throw new LlmRetriesExhaustedError(`${lastError.status}: ${errorText}`, retries + 1);
  }
  throw lastError instanceof Error ? lastError : new Error(errorText);
}

function isRetryable(err: unknown): boolean {
  if (err instanceof APIConnectionTimeoutError) return true; // timeout
  if (err instanceof APIConnectionError) return true; // transient network
  if (err instanceof APIError) {
    if (err.status === 429) return true; // rate limited — obey Retry-After
    if (typeof err.status === "number" && err.status >= 500) return true; // provider 5xx
    // Learned the hard way (2026-08-11): the zen free-tier gateway masks its
    // OWN upstream failures as 403 — "Upstream request failed:
    // [server_error] Upstream response was not valid JSON". A provider-side
    // failure is transient and retryable; a real auth 403 is not. So classify
    // by the error body, not the status code alone.
    if (err.status === 403 && /upstream|server_error/i.test(errorBody(err))) return true;
    return false; // 400/401/403 — never retried
  }
  return false;
}

function errorBody(err: APIError): string {
  const data = (err as APIError & { error?: unknown }).error;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return err.message;
}

function getDelayMs(err: unknown, attempt: number): number {
  // If a 429 carries Retry-After, obey it instead of guessing.
  if (err instanceof APIError && err.status === 429) {
    const retryAfter = parseRetryAfter(err);
    if (retryAfter !== null) return retryAfter;
  }
  const base = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
  return base + Math.floor(Math.random() * JITTER_MS);
}

function parseRetryAfter(err: APIError): number | null {
  const headers = (err as APIError & { headers?: Record<string, string> }).headers;
  const raw = headers?.["retry-after"] ?? headers?.["Retry-After"];
  if (!raw) return null;
  const seconds = Number(raw);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(raw); // HTTP-date format
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function logCost(
  cfg: Config,
  meta: CallMeta,
  result: { inputTokens: number | null; outputTokens: number | null; durationMs: number; retries: number; error: string | null },
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    prompt_version: meta.promptVersion,
    repair: meta.repair,
    model: cfg.llmModel,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    duration_ms: result.durationMs,
    retries: result.retries,
    error: result.error,
  });
  mkdirSync(dirname(COST_LOG_PATH), { recursive: true });
  appendFileSync(COST_LOG_PATH, `${line}\n`);
}
