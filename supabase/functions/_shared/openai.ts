// Shared OpenAI Responses API helper (POST /v1/responses).
// Docs: https://developers.openai.com/api/docs/guides/migrate-to-responses

export const OPENAI_URL = "https://api.openai.com/v1/responses";
export const IMAGES_URL = "https://api.openai.com/v1/images/generations";
export const IMAGE_EDITS_URL = "https://api.openai.com/v1/images/edits";
export const DEFAULT_MODEL = "gpt-6-astra";
export const DEFAULT_IMAGE_MODEL = "gpt-image-2.6-flare";

export type Effort = "none" | "low" | "medium" | "high" | "xhigh" | "max";

export interface ResponsesOptions {
  instructions: string;
  input: string;
  /** JSON Schema (strict). Top level must be an object with additionalProperties:false. */
  schema?: { name: string; schema: Record<string, unknown> };
  effort?: Effort;
  maxOutputTokens?: number;
  /** Enable the built-in web search tool (true, or tool options). */
  webSearch?: boolean | WebSearchOptions;
  /** "required" forces at least one search. */
  toolChoice?: "auto" | "required";
  fetchImpl?: typeof fetch;
}

export interface WebSearchOptions {
  searchContextSize?: "low" | "medium" | "high";
  userLocation?: { country?: string; city?: string; region?: string; timezone?: string };
  allowedDomains?: string[];
  blockedDomains?: string[];
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
  if (opts.webSearch) {
    const o: WebSearchOptions = typeof opts.webSearch === "object" ? opts.webSearch : {};
    const tool: Record<string, unknown> = { type: "web_search" };
    if (o.searchContextSize) tool.search_context_size = o.searchContextSize;
    if (o.userLocation) tool.user_location = { type: "approximate", ...o.userLocation };
    if (o.allowedDomains?.length || o.blockedDomains?.length) {
      tool.filters = {
        ...(o.allowedDomains?.length ? { allowed_domains: o.allowedDomains.slice(0, 100) } : {}),
        ...(o.blockedDomains?.length ? { blocked_domains: o.blockedDomains.slice(0, 100) } : {}),
      };
    }
    body.tools = [tool];
    if (opts.toolChoice) body.tool_choice = opts.toolChoice;
    // Full list of URLs the model consulted (citations alone can be empty with structured output).
    body.include = ["web_search_call.action.sources"];
  }
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

/** Sources consulted by web search (web_search_call.action.sources) merged with url_citation annotations. */
export function extractSources(data: any): { title: string; url: string }[] {
  const seen = new Map<string, string>();
  for (const c of extractCitations(data)) seen.set(c.url, c.title);
  for (const item of data?.output ?? []) {
    if (item?.type !== "web_search_call") continue;
    for (const src of item.action?.sources ?? []) {
      if (src?.url && !seen.has(src.url)) seen.set(src.url, src.title ?? src.url);
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
  return (await callResponsesJsonWithData<T>(opts)).value;
}

/** Same as callResponsesJson, but also returns the raw payload (for sources/citations). */
export async function callResponsesJsonWithData<T = any>(opts: ResponsesOptions): Promise<{ value: T; data: any }> {
  const { text, data } = await callResponses(opts);
  try {
    return { value: JSON.parse(text) as T, data };
  } catch {
    throw new OpenAIError("OpenAI returned invalid JSON");
  }
}

export interface ImageOptions {
  prompt: string;
  size?: string;
  quality?: "low" | "medium" | "high" | "xhigh" | "max" | "auto";
  outputFormat?: "png" | "jpeg" | "webp";
  background?: "transparent" | "opaque" | "auto";
  /** Stable, privacy-preserving end-user id (<=128 chars). */
  safetyIdentifier?: string;
  /** Reference image(s) for /v1/images/edits. */
  referenceImages?: { bytes: Uint8Array; type: string; name: string }[];
  fetchImpl?: typeof fetch;
}

export function buildImageBody(opts: ImageOptions, model: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    prompt: opts.prompt,
    size: opts.size ?? "1024x1024",
    quality: opts.quality ?? "medium",
    output_format: opts.outputFormat ?? "webp",
  };
  if (opts.background) body.background = opts.background;
  if (opts.safetyIdentifier) body.safety_identifier = opts.safetyIdentifier.slice(0, 128);
  return body;
}

/** Generate (or edit, when referenceImages is given) an image. Returns raw bytes. */
export async function callImages(opts: ImageOptions): Promise<{ bytes: Uint8Array; contentType: string; revisedPrompt?: string }> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new OpenAIError("OPENAI_API_KEY is not configured");
  const model = Deno.env.get("OPENAI_IMAGE_MODEL") ?? DEFAULT_IMAGE_MODEL;
  const body = buildImageBody(opts, model);
  const doFetch = opts.fetchImpl ?? fetch;

  let res: Response;
  if (opts.referenceImages?.length) {
    const form = new FormData();
    for (const [k, v] of Object.entries(body)) form.append(k, String(v));
    for (const img of opts.referenceImages) {
      form.append("image[]", new Blob([img.bytes], { type: img.type }), img.name);
    }
    res = await doFetch(IMAGE_EDITS_URL, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  } else {
    res = await doFetch(IMAGES_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new OpenAIError(data?.error?.message ?? `OpenAI image request failed (${res.status})`, res.status);
  const b64: string | undefined = data?.data?.[0]?.b64_json;
  if (!b64) throw new OpenAIError("OpenAI returned no image data");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const fmt = String(body.output_format);
  return { bytes, contentType: `image/${fmt}`, revisedPrompt: data?.data?.[0]?.revised_prompt };
}
