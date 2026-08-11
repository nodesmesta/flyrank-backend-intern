// Throwaway Stage-0 proof: get one sentence out of the model, from this machine.
// Prints the model's reply to the prompt "Reply with exactly the word: ready".
// Deleted after the Stage 0 checkpoint (the assignment calls it a throwaway file).
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  config({ path: resolve(__dirname, "..", "..", ".env") });

  // Three environment variables are the only difference between a model running
  // on a laptop and one running in a datacentre — never hard-code a provider.
  // OpenCode Zen free tier refuses a non-empty dummy key (401) and accepts no
  // auth at all, while the SDK demands a non-empty apiKey at construction. So:
  // satisfy the constructor, then strip the Authorization header via a custom
  // fetch unless a real key is configured (the FL-07 pattern: only send a key
  // when one exists).
  const apiKey = process.env.LLM_API_KEY || "";
  const client = new OpenAI({
    baseURL: process.env.LLM_BASE_URL ?? "https://opencode.ai/zen/v1",
    apiKey: apiKey || "unused",
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      if (apiKey) headers.set("Authorization", `Bearer ${apiKey}`);
      else headers.delete("Authorization");
      return fetch(url, { ...init, headers });
    },
  });

  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL ?? "deepseek-v4-flash-free",
    messages: [{ role: "user", content: "Reply with exactly the word: ready" }],
    temperature: 0,
  });

  console.log(res.choices[0]?.message?.content ?? "(empty reply)");
}

main().catch((err) => {
  console.error("[hello] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
