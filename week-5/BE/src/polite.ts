import type { ScrapeConfig } from "./config.js";

/**
 * RobotsPolicy — the parsed, per-project view of robots.txt.
 *
 * We hand-roll the parser (no third-party dep) both to keep the dependency
 * surface small and because the assignment wants the pipeline "built by your
 * own hands". It implements the RFC-9309 subset we need:
 *   - select the group whose agent line matches our User-Agent (longest match
 *     wins, `*` is the fallback),
 *   - match path patterns (supports `*` and trailing `$`),
 *   - longest matching rule wins, an `allow` overrides a `disallow` on ties.
 */
export interface RobotsPolicy {
  present: boolean;
  allow: string[];
  disallow: string[];
  crawlDelayMs: number;
  note: string;
}

interface RobotsGroup {
  agents: string[];
  allow: string[];
  disallow: string[];
  crawlDelayMs: number;
}

/** Turn a single robots.txt pattern (e.g. "/catalogue/*", "/search", "*") into a RegExp. */
function patternToRegExp(pattern: string): RegExp {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const escaped = body.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  // A bare "*" (allow/disallow all) should match every path.
  const source = body === "*" ? ".*" : `${escaped}${anchored ? "$" : ""}`;
  return new RegExp(`^${source}`);
}

function matchesPath(pattern: string, path: string): boolean {
  if (pattern === "") return false;
  return patternToRegExp(pattern).test(path);
}

/** Parse the raw body of robots.txt into the policy that applies to `userAgent`. */
export function parseRobots(rawBody: string, userAgent: string): RobotsPolicy {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup = { agents: [], allow: [], disallow: [], crawlDelayMs: 0 };
  let sawAnyGroup = false;

  for (const rawLine of rawBody.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === "user-agent") {
      if (current.agents.length > 0 || sawAnyGroup) {
        groups.push(current);
      }
      current = { agents: [value.toLowerCase()], allow: [], disallow: [], crawlDelayMs: 0 };
      sawAnyGroup = true;
    } else if (key === "disallow") {
      current.disallow.push(value);
    } else if (key === "allow") {
      current.allow.push(value);
    } else if (key === "crawl-delay") {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) current.crawlDelayMs = n * 1000;
    }
  }
  if (current.agents.length > 0 || sawAnyGroup) groups.push(current);

  // Choose the group that governs our UA: exact agent token wins over *, and
  // longer agent tokens win over shorter ones.
  const ua = userAgent.toLowerCase();
  let best: RobotsGroup | null = null;
  let bestLength = -1;
  for (const g of groups) {
    for (const a of g.agents) {
      if (a === "*" || ua.includes(a)) {
        if (a.length > bestLength) {
          bestLength = a.length;
          best = g;
        }
      }
    }
  }

  const empty = best ?? { agents: [], allow: [], disallow: [], crawlDelayMs: 0 };
  return {
    present: true,
    allow: empty.allow,
    disallow: empty.disallow,
    crawlDelayMs: empty.crawlDelayMs,
    note: best
      ? `applied robots.txt group for UA "${best.agents.join("/")}"`
      : "no robots.txt group matches this UA; no restrictions applied",
  };
}

/** A policy for a host that serves no robots.txt (404/403/empty). Default: permissive. */
export function permissivePolicy(): RobotsPolicy {
  return {
    present: false,
    allow: ["*"],
    disallow: [],
    crawlDelayMs: 0,
    note: "no robots.txt served (404/empty) — RFC default: permissive, still throttled",
  };
}

/** True when `path` may be fetched under `policy` (RFC 9309 longest-rule-wins). */
export function isPathAllowed(policy: RobotsPolicy, path: string): boolean {
  if (!policy.present) return true;
  let winner: { kind: "allow" | "disallow"; len: number } | null = null;
  for (const pat of policy.disallow) {
    if (matchesPath(pat, path) && (!winner || pat.length > winner.len)) {
      winner = { kind: "disallow", len: pat.length };
    }
  }
  for (const pat of policy.allow) {
    if (matchesPath(pat, path) && (!winner || pat.length > winner.len)) {
      winner = { kind: "allow", len: pat.length };
    }
  }
  return !winner || winner.kind === "allow";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * PoliteFetcher — the professionalism layer.
 * Reads robots.txt once, refuses disallowed paths, throttles every request to
 * respect a crawl-delay, and always identifies itself with a descriptive UA.
 */
export class PoliteFetcher {
  private policy: RobotsPolicy | null = null;
  private lastFetchAt = 0;

  constructor(private readonly cfg: ScrapeConfig) {}

  async loadRobots(): Promise<RobotsPolicy> {
    if (this.policy) return this.policy;
    const url = new URL("/robots.txt", this.cfg.baseUrl).toString();
    let policy: RobotsPolicy;
    try {
      const res = await fetch(url, { headers: { "User-Agent": this.cfg.userAgent } });
      if (!res.ok) {
        policy = permissivePolicy();
      } else {
        const body = await res.text();
        policy = body.trim()
          ? parseRobots(body, this.cfg.userAgent)
          : permissivePolicy();
      }
    } catch {
      policy = permissivePolicy();
    }
    this.policy = policy;
    return policy;
  }

  async allowed(path: string): Promise<boolean> {
    await this.loadRobots();
    return isPathAllowed(this.policy!, path);
  }

  /** Throttle so we never fire sooner than max(config, robots) between requests. */
  private async throttle(): Promise<void> {
    const delay = Math.max(this.policy?.crawlDelayMs ?? 0, this.cfg.crawlDelayMs);
    const wait = delay - (Date.now() - this.lastFetchAt);
    if (wait > 0) await sleep(wait);
  }

  /**
   * Fetch `url` politely. Returns null when robots.txt forbids the path or the
   * server errors; logs the request so politeness is observable.
   */
  async fetch(url: string | URL): Promise<string | null> {
    const u = typeof url === "string" ? new URL(url) : url;
    const path = `${u.pathname}${u.search}`;
    await this.loadRobots();
    if (!isPathAllowed(this.policy!, path)) {
      if (this.cfg.logEnabled) console.log(`[polite] denied by robots: ${u.pathname}`);
      return null;
    }
    await this.throttle();
    const res = await fetch(u, {
      headers: { "User-Agent": this.cfg.userAgent, Accept: "text/html" },
    });
    this.lastFetchAt = Date.now();
    if (this.cfg.logEnabled) {
      console.log(`[polite] GET ${res.status} ${u.pathname} (delay enforced)`);
    }
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  }
}