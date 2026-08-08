import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "..", ".env");

export interface Config {
  brightMcpUrl: string;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  assetInput: string;
  reportDir: string;
  logFile: string;
  rateLimitMs: number;
}

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const raw = readFileSync(ENV_PATH, "utf-8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
  } catch {
    // .env optional; caller decides what to do
  }
  return out;
}

export function loadConfig(): Config {
  const env = loadEnv();
  const required = (k: string): string => {
    const v = env[k];
    if (!v) throw new Error(`Missing ${k} in .env (copy .env.example and fill it)`);
    return v;
  };
  return {
    brightMcpUrl: required("BRIGHT_MCP_URL"),
    llmBaseUrl: required("LLM_BASE_URL"),
    llmApiKey: env["LLM_API_KEY"] ?? "",
    llmModel: required("LLM_MODEL"),
    assetInput: resolve(__dirname, "..", "data", "input", "assets.json"),
    reportDir: resolve(__dirname, "..", "data", "reports"),
    logFile: resolve(__dirname, "..", "data", "run-log.jsonl"),
    rateLimitMs: 1500,
  };
}
