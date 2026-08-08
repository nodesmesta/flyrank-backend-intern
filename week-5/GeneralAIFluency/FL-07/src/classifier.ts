export interface Signal {
  signal: string;
  klass: "Opportunity" | "Risk" | "Noise";
  reason: string;
  source_url: string;
}

export interface Classification {
  signals: Signal[];
  recommendation: string;
}

/**
 * Thrown when the LLM output cannot be turned into a valid Classification.
 * Carries a sample of the offending text so failures are never silent.
 */
export class ClassificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClassificationError";
  }
}

/**
 * Classify market findings via an OpenAI-compatible chat-completions endpoint
 * (OpenCode Zen free tier: no auth required, base https://opencode.ai/zen/v1).
 *
 * Parse strategy (no silent failures):
 *  1. ask for JSON in plain text (DeepSeek-style endpoints reject response_format)
 *  2. extract a JSON object with a real brace-matching scanner, not regex guesses
 *  3. validate the shape strictly; items that fail validation are dropped WITH a warning
 *  4. if the whole payload is unparseable, retry once with a hardened instruction,
 *     then throw a ClassificationError that includes a sample of the raw output
 */
export async function classify(
  baseUrl: string,
  apiKey: string,
  model: string,
  assetContext: string,
  findings: string,
): Promise<Classification> {
  const system =
    "You are the classifier of Asset Signal Scout for Asset Guard. " +
    "Given one physical asset and market findings, classify each finding as " +
    "Opportunity, Risk, or Noise. Every kept signal needs a short reason and the " +
    "source URL. Noise: irrelevant, geo-mismatched, or unverifiable. Reply with " +
    "JSON only: {\"signals\":[{\"signal\":\"...\",\"klass\":\"Opportunity|Risk|Noise\"," +
    "\"reason\":\"...\",\"source_url\":\"...\"}],\"recommendation\":\"...\"}. " +
    "Never invent prices, trends, or sources. If nothing is verifiable, set signals to [] " +
    "and recommendation to \"no signal found\" plus the reason.";

  const baseUser = `ASSET:\n${assetContext}\n\nMARKET FINDINGS:\n${findings}`;
  const hardened = baseUser +
    "\n\nIMPORTANT: respond with ONLY a single raw JSON object — no markdown, " +
    "no code fences, no commentary before or after.";

  let lastError: Error | null = null;
  for (const attempt of [0, 1]) {
    const userPrompt = attempt === 0 ? baseUser : hardened;
    try {
      const content = await chatOnce(baseUrl, apiKey, model, system, userPrompt);
      return parseStrict(content, attempt);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 0) {
        // retry on ANY failure (transient 500s/rate limits AND parse issues),
        // with a hardened instruction on the second attempt
        console.warn(`[classifier] attempt 1 failed (${lastError.message.slice(0, 120)}…) — retrying`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastError!;
}

async function chatOnce(
  baseUrl: string,
  apiKey: string,
  model: string,
  system: string,
  user: string,
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM classify failed ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) {
    throw new Error("LLM returned empty content");
  }
  return content;
}

/** Parse LLM text into a validated Classification; throws ClassificationError on failure. */
function parseStrict(content: string, attempt: number): Classification {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    const candidate = extractJsonObject(content);
    if (candidate === null) {
      throw new ClassificationError(
        `no JSON object found in model output (attempt ${attempt + 1}). ` +
        `Sample: ${content.slice(0, 240).replace(/\s+/g, " ")}`,
      );
    }
    try {
      raw = JSON.parse(candidate);
    } catch (e) {
      throw new ClassificationError(
        `extracted candidate is not valid JSON (attempt ${attempt + 1}): ${(e as Error).message}. ` +
        `Sample: ${candidate.slice(0, 240).replace(/\s+/g, " ")}`,
      );
    }
  }
  return validate(raw, attempt);
}

/**
 * Extract a JSON object using a real brace-matching scanner that understands
 * strings and escape sequences (unlike greedy regex, which silently truncates
 * nested objects or quoted braces).
 */
function extractJsonObject(text: string): string | null {
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{") continue;
    const end = braceMatchEnd(text, i);
    if (end === -1) continue;
    const candidate = text.slice(i, end + 1);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      continue; // not the object we want; keep scanning
    }
  }
  return null;
}

function braceMatchEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Strict shape validation. Invalid items are dropped WITH a console warning. */
function validate(raw: unknown, attempt: number): Classification {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ClassificationError(`top level is not a JSON object (attempt ${attempt + 1})`);
  }
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.signals)) {
    throw new ClassificationError(
      `"signals" is not an array (attempt ${attempt + 1}, got ${typeof r.signals})`,
    );
  }

  const signals: Signal[] = [];
  const dropped: string[] = [];
  for (const item of r.signals) {
    if (typeof item !== "object" || item === null) {
      dropped.push("non-object item");
      continue;
    }
    const s = item as Record<string, unknown>;
    const signal = typeof s.signal === "string" ? s.signal.trim() : "";
    if (!signal) {
      dropped.push("empty signal");
      continue;
    }
    const klass = normalizeKlass(s.klass);
    if (!klass) {
      dropped.push(`signal "${signal.slice(0, 60)}" has unknown klass ${JSON.stringify(s.klass)}`);
      continue;
    }
    const sourceUrl = typeof s.source_url === "string" ? s.source_url.trim() : "";
    if (!sourceUrl) {
      dropped.push(`signal "${signal.slice(0, 60)}" has no source_url`);
      continue;
    }
    signals.push({
      signal,
      klass,
      reason: typeof s.reason === "string" ? s.reason.trim() : "",
      source_url: sourceUrl,
    });
  }
  if (dropped.length > 0) {
    console.warn(`[classifier] dropped ${dropped.length} invalid item(s): ${dropped.join("; ")}`);
  }
  return {
    signals,
    recommendation: typeof r.recommendation === "string" ? r.recommendation : "",
  };
}

/** Returns null for unknown klass — the caller decides how to surface it (never silently Noise). */
function normalizeKlass(k: unknown): Signal["klass"] | null {
  if (typeof k !== "string") return null;
  const v = k.trim().toLowerCase();
  if (v.startsWith("opportunit")) return "Opportunity";
  if (v.startsWith("risk")) return "Risk";
  if (v.startsWith("noise") || v.startsWith("neutral")) return "Noise";
  return null;
}
