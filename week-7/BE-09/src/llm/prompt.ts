// Loads the versioned decision prompt from prompts/decision-v1.md.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const PROMPT_VERSION = "decision-v1";

export function loadDecisionPrompt(): string {
  return readFileSync(resolve(__dirname, "..", "..", "prompts", "decision-v1.md"), "utf-8");
}
