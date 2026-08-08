import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export interface SerpResult {
  link?: string;
  title?: string;
  description?: string;
}

export interface Serp {
  organic: SerpResult[];
  current_page?: number;
}

export class BrightData {
  private client: Client;
  private transport: StreamableHTTPClientTransport;

  constructor(url: string) {
    this.transport = new StreamableHTTPClientTransport(new URL(url));
    this.client = new Client({ name: "asset-signal-scout", version: "0.1.0" });
  }

  async connect(): Promise<void> {
    await this.client.connect(this.transport);
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  /** search_engine — returns raw SERP JSON parsed. */
  async search(query: string, engine = "google"): Promise<Serp> {
    const res = await this.client.callTool({
      name: "search_engine",
      arguments: { query, engine },
    });
    const text = extractText(res);
    return JSON.parse(text) as Serp;
  }

  /** scrape_as_markdown — returns page content as markdown text. */
  async scrape(url: string): Promise<string> {
    const res = await this.client.callTool({
      name: "scrape_as_markdown",
      arguments: { url },
    });
    return extractText(res);
  }
}

function extractText(res: unknown): string {
  const r = res as { content?: Array<{ type?: string; text?: string }> };
  const parts = (r.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text as string);
  return unwrap(parts.join("\n"));
}

/** Bright Data wraps tool output in a SECURITY NOTICE / UNTRUSTED marker block; strip it. */
function unwrap(text: string): string {
  const begin = text.indexOf("=====UNTRUSTED_");
  if (begin === -1) return text;
  const bodyStart = text.indexOf("_BEGIN=====", begin);
  if (bodyStart === -1) return text;
  const endMark = text.indexOf("=====UNTRUSTED_", bodyStart + 10);
  if (endMark === -1) return text.slice(bodyStart + "_BEGIN=====".length);
  return text.slice(bodyStart + "_BEGIN=====".length, endMark);
}
