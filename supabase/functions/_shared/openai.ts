// Shared OpenAI Responses API helper (POST /v1/responses).
// Docs: https://developers.openai.com/api/docs/guides/migrate-to-responses

export const OPENAI_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_MODEL = "gpt-6-astra";

export type Effort = "none" | "low" | "medium" | "high" | "xhigh" | "max";

export interface ResponsesOptions {
  instructions: string;
  input: string;
  /** JSON Schema (strict). Top level must be an object with additionalProperties:false. */
  schema?: { name: string; schema: Record<string, unknown> };
  effort?: Effort;
  maxOutputTokens?: number;
  /** Enable the built-in web search tool. */
  webSearch?: boolean;
  fetchImpl?: typeof fetch;
}

export class OpenAIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "OpenAIError";
  }
}

export function hasOpenAIKey(): boolean {
  return Boolean(Deno.env.get("OPENAI_API_KEY"));
}

export function buildRequestBody(opts: ResponsesOptions, model: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    instructions: opts.instructions,
    input: opts.input,
    store: false,
    reasoning: { effort: opts.effort ?? "low" },
  };
  if (opts.maxOutputTokens) body.max_output_tokens = opts.maxOutputTokens;
  if (opts.schema) {
    body.text = {
      format: { type: "json_schema", name: opts.schema.name, strict: true, schema: opts.schema.schema },
    };
  }
  if (opts.webSearch) body.tools = [{ type: "web_search" }];
  return body;
}

/** Extract text from a Responses payload (output_text helper or output[] items). */
export function extractText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text) return data.output_text;
  const parts: string[] = [];
  for (const item of data?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const c of item.content ?? []) {
      if (c?.type === "output_text" && typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("").trim();
}

/** Collect url_citation annotations from a Responses payload. */
export function extractCitations(data: any): { title: string; url: string }[] {
  const seen = new Map<string, string>();
  for (const item of data?.output ?? []) {
    for (const c of item?.content ?? []) {
      for (const a of c?.annotations ?? []) {
        if (a?.type === "url_citation" && a.url && !seen.has(a.url)) seen.set(a.url, a.title ?? a.url);
      }
    }
  }
  return [...seen].map(([url, title]) => ({ url, title }));
}

export async function callResponses(opts: ResponsesOptions): Promise<{ text: string; data: any }> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new OpenAIError("OPENAI_API_KEY is not configured");
  const model = Deno.env.get("OPENAI_MODEL") ?? DEFAULT_MODEL;
  const res = await (opts.fetchImpl ?? fetch)(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(buildRequestBody(opts, model)),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new OpenAIError(data?.error?.message ?? `OpenAI request failed (${res.status})`, res.status);
  }
  if (data?.status === "incomplete") {
    console.warn("OpenAI response incomplete:", data.incomplete_details);
  }
  const text = extractText(data);
  if (!text) throw new OpenAIError("OpenAI returned no text output");
  return { text, data };
}

/** Call with a JSON schema and return the parsed object. */
export async function callResponsesJson<T = any>(opts: ResponsesOptions): Promise<T> {
  const { text } = await callResponses(opts);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new OpenAIError("OpenAI returned invalid JSON");
  }
}
