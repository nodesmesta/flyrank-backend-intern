// Environment loader for the week-6 BE task.
// dotenv reads week-6/BE/.env (explicit path — the CWD when scripts run from
// the repo root is the root, not this folder). Same pattern as BE-03.
import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface Config {
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmStub: boolean;
  llmEnabled: boolean;
  llmTimeoutMs: number;
  port: number;
}

export function loadConfig(): Config {
  loadDotenv({ path: resolve(__dirname, "..", "..", ".env"), quiet: true });
  return {
    llmBaseUrl: process.env.LLM_BASE_URL ?? "https://opencode.ai/zen/v1",
    llmApiKey: process.env.LLM_API_KEY ?? "",
    llmModel: process.env.LLM_MODEL ?? "deepseek-v4-flash-free",
    llmStub: process.env.LLM_STUB === "1",
    llmEnabled: process.env.LLM_ENABLED !== "false",
    llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 30000),
    port: Number(process.env.PORT ?? 3000),
  };
}
