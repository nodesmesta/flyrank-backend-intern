// Eval runner for POST /enrich — Stage 5.
// Posts the 8 labeled cases in cases.json through the REAL HTTP endpoint and
// scores the answers. Scoring rule (also in cases.json): a case passes when
// the returned category is in [expected_category] + accepted_categories;
// quality flags and confidence are reported per case, not scored.
//
// Run: npm run eval:be6   (ENRICH_URL overrides the target, default :3000)
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CASES_PATH = resolve(__dirname, "cases.json");
const ENRICH_URL = process.env.ENRICH_URL ?? "http://localhost:3000/enrich";

interface EvalCase {
  id: string;
  label: string;
  title: string;
  declared_category: string;
  url: string;
  description: string;
  expected_category: string;
  accepted_categories: string[];
  expected_flags: string[];
  notes: string;
}

interface EvalDoc {
  prompt_version: string;
  model: string;
  created: string;
  scoring: string;
  cases: EvalCase[];
}

interface EnrichResponse {
  category?: string;
  confidence?: number;
  summary?: string;
  quality_flags?: string[];
  error?: string;
}

async function runCase(c: EvalCase): Promise<{ pass: boolean; line: string }> {
  const res = await fetch(ENRICH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      record: {
        title: c.title,
        description: c.description,
        url: c.url,
        category: c.declared_category,
      },
    }),
  });
  const body = (await res.json()) as EnrichResponse;

  if (res.status !== 200 || !body.category) {
    return {
      pass: false,
      line: `[FAIL] ${c.id.padEnd(22)} HTTP ${res.status} — ${body.error ?? "no category in response"}`,
    };
  }

  const accepted = [c.expected_category, ...c.accepted_categories];
  const pass = accepted.includes(body.category);
  const flagHits = c.expected_flags.filter((f) => body.quality_flags?.includes(f)).length;
  const flagsText = (body.quality_flags ?? []).join(",") || "[]";
  const mark = pass ? "PASS" : "FAIL";
  const hit = c.expected_flags.length === 0 ? "-" : `${flagHits}/${c.expected_flags.length}`;
  return {
    pass,
    line:
      `[${mark}] ${c.id.padEnd(22)} expected=${c.expected_category.padEnd(16)} got=${JSON.stringify(body.category ?? "?").padEnd(18)}` +
      ` conf=${body.confidence?.toFixed(2)} flags=${flagsText} flagHits=${hit}`,
  };
}

async function main(): Promise<void> {
  const doc = JSON.parse(readFileSync(CASES_PATH, "utf-8")) as EvalDoc;
  console.log(`Evaluating ${doc.cases.length} cases against ${ENRICH_URL}`);
  console.log(`prompt=${doc.prompt_version} model=${doc.model} date=${new Date().toISOString().slice(0, 10)}`);
  console.log("-".repeat(120));

  let passed = 0;
  for (const c of doc.cases) {
    const { pass, line } = await runCase(c);
    if (pass) passed++;
    console.log(line);
  }
  console.log("-".repeat(120));
  const pct = Math.round((passed / doc.cases.length) * 100);
  console.log(`EVAL SCORE: ${passed}/${doc.cases.length} (${pct}%)`);
}

main().catch((err) => {
  console.error("eval run failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
