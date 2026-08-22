// Environment loader — week-7/BE-09 "Visual AI workflow".
// dotenv reads week-7/BE-09/.env (explicit path: when scripts run from the repo
// root the CWD is the root, not this folder). Same pattern as BE-03 / BE-07.
//
// Phase 1 exposes the server port; the LLM provider settings (LLM_BASE_URL /
// LLM_API_KEY / LLM_MODEL) are documented in .env.example now and consumed by
// the executor client added in Phase 3.
import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

loadDotenv({ path: resolve(__dirname, "..", ".env"), quiet: true });

export const port = Number(process.env.PORT ?? 3000);
