// Environment loader — week-7/BE-09 "Visual AI workflow".
// dotenv reads week-7/BE-09/.env (explicit path: when scripts run from the repo
// root the CWD is the root, not this folder). Same pattern as BE-03 / BE-07.
import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

loadDotenv({ path: resolve(__dirname, "..", ".env"), quiet: true });

export interface Config {
  port: number;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmStub: boolean;
  llmEnabled: boolean;
  llmTimeoutMs: number;
}

function loadConfig(): Config {
  return {
    port: Number(process.env.PORT ?? 3000),
    llmBaseUrl: process.env.LLM_BASE_URL ?? "https://opencode.ai/zen/v1",
    llmApiKey: process.env.LLM_API_KEY ?? "",
    llmModel: process.env.LLM_MODEL ?? "deepseek-v4-flash-free",
    llmStub: process.env.LLM_STUB === "1",
    llmEnabled: process.env.LLM_ENABLED !== "false",
    llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 30000),
  };
}

export const config = loadConfig();
