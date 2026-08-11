// The LLM client. One OpenAI-compatible client for any provider — base URL,
// key and model are the only differences (three env vars, never hard-coded).
//
// OpenCode Zen free tier refuses a non-empty dummy key (401) and accepts no
// auth at all, while the openai SDK demands a non-empty apiKey at construction.
// So: satisfy the constructor, then strip the Authorization header via a custom
// fetch unless a real key is configured (the FL-07 pattern: only send a key
// when one exists).
import OpenAI from "openai";
import type { Config } from "./config.js";

export function makeClient(cfg: Config): OpenAI {
  return new OpenAI({
    baseURL: cfg.llmBaseUrl,
    apiKey: cfg.llmApiKey || "unused",
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      if (cfg.llmApiKey) headers.set("Authorization", `Bearer ${cfg.llmApiKey}`);
      else headers.delete("Authorization");
      return fetch(url, { ...init, headers });
    },
  });
}

/**
 * One chat-completions call, temperature 0 — the same input must give the
 * same answer, not creativity. Returns the raw model text; parsing and
 * validation live in parse.ts (Stage 3).
 */
export async function complete(cfg: Config, system: string, user: string): Promise<string> {
  const client = makeClient(cfg);
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
  return content;
}
