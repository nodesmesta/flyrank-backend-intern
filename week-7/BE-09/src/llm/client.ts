// The LLM decision engine — week-7/BE-09 Phase 3.
//
// One OpenAI-compatible client for any provider (OpenCode Zen free tier by
// default) — base URL, key and model are three env vars. The provider quirk
// (proven in week-6 A17): the free tier REFUSES a non-empty dummy key (401) but
// accepts no auth, while the openai SDK demands a non-empty apiKey. So we
// satisfy the constructor, then strip/set the Authorization header via a custom
// fetch only when a real key exists.
//
// Contract: the model must answer one question with exactly YES or NO. We parse
// the reply, and if it is not a clean YES/NO we perform EXACTLY ONE repair
// retry (hand the model back its own invalid answer). A second failure throws —
// the executor marks the run failed rather than guess a branch.
import OpenAI, { APIError, APIConnectionError, APIConnectionTimeoutError } from "openai";
import { config } from "../config.js";
import { loadDecisionPrompt, PROMPT_VERSION } from "./prompt.js";

export function makeClient(): OpenAI {
  const key = config.llmApiKey;
  return new OpenAI({
    baseURL: config.llmBaseUrl,
    apiKey: key || "unused",
    timeout: config.llmTimeoutMs,
    maxRetries: 0,
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      if (key) headers.set("Authorization", `Bearer ${key}`);
      else headers.delete("Authorization");
      return fetch(url, { ...init, headers });
    },
  });
}

export type Decision = "YES" | "NO";

function parseDecision(text: string): Decision | null {
  const word = text
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, " ")
    .split(/\s+/)
    .find((w) => w === "YES" || w === "NO");
  return word === "YES" || word === "NO" ? word : null;
}

/** Stub (LLM_STUB=1): zero model calls — reach a "YES" branch when the prompt
 * mentions a support/billing concern, else "NO". Lets the whole traversal be
 * built and tested without paying for or depending on the provider. */
function stubDecision(promptText: string): Decision {
  const q = promptText.toLowerCase();
  return /support|billing|refund|issue/.test(q) ? "YES" : "NO";
}

function isRetryable(err: unknown): boolean {
  if (err instanceof APIConnectionTimeoutError) return true;
  if (err instanceof APIConnectionError) return true;
  if (err instanceof APIError) {
    if (err.status === 429) return true;
    if (typeof err.status === "number" && err.status >= 500) return true;
    // Zen free-tier gateway masks its OWN upstream failures as a 403 whose body
    // says "Upstream request failed: [server_error]..." — retry those, not real
    // auth 403s (see A17 notes in this repo).
    if (err.status === 403) {
      const data = (err as APIError & { error?: unknown }).error;
      const msg =
        typeof data === "string" ? data : (data as { message?: string })?.message ?? "";
      if (/upstream|server_error/i.test(String(msg) + err.message)) return true;
    }
    return false;
  }
  return false;
}

async function callModel(system: string, user: string): Promise<string> {
  const client = makeClient();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: config.llmModel,
        temperature: 0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const content = res.choices[0]?.message?.content ?? "";
      if (!content.trim()) throw new Error("LLM returned empty content");
      return content;
    } catch (err) {
      if (!isRetryable(err) || attempt === 2) throw err;
      const delay = Math.min(2000, 300 * 2 ** attempt) + Math.floor(Math.random() * 300);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

/** Ask the model to decide one question. Returns exactly "YES" | "NO". */
export async function decide(promptText: string): Promise<Decision> {
  if (!config.llmEnabled) {
    throw new Error("LLM disabled (LLM_ENABLED=false) — can't make a decision");
  }
  if (config.llmStub) return stubDecision(promptText);

  const system = loadDecisionPrompt();
  const question = `Answer the following question with exactly YES or NO.\n\nQuestion: ${promptText}`;

  const first = parseDecision(await callModel(system, question));
  if (first) return first;

  // Repair exactly once: hand the model its own broken reply back.
  const second = parseDecision(
    await callModel(
      system,
      `${question}\n\nYour previous reply was not a valid decision. Reply with exactly YES or NO.`,
    ),
  );
  if (second) return second;

  throw new Error(
    `Model did not return a YES/NO after the prompt (${PROMPT_VERSION}) and one repair`,
  );
}
