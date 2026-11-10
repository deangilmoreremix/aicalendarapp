import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { hasOpenAIKey, streamResponses } from "../_shared/openai.ts";

// Streams OpenAI Responses API output as SSE. body: { operation, ...params }
const OPS: Record<string, (b: any) => { instructions: string; input: string; webSearch?: boolean }> = {
  "task-suggestion": (b) => ({
    instructions: "You help plan CRM tasks. Reply with a concise bulleted list of suggested tasks (title, priority, due date, one-line reason).",
    input: `Suggest tasks for: ${String(b.prompt ?? "").slice(0, 1000)}`,
  }),
  "contact-enrichment": (b) => ({
    instructions:
      "You are a B2B contact enrichment assistant. Search the public web for professional information only (no private data). State only what you find evidence for and say when unknown.",
    input: `Enrich this contact: ${JSON.stringify(b.contact ?? {})}`,
    webSearch: true,
  }),
  "email-composition": (b) => ({
    instructions: "You are an email copywriting assistant. Compose a concise, professional, personalized email. Plain text only.",
    input: `Compose an email for ${JSON.stringify(b.recipient ?? {})}. Context: ${b.context ?? ""}`,
  }),
  "meeting-planning": (b) => ({
    instructions: "You are a meeting planning assistant. Return a short plain-text plan: objectives, agenda, prep items.",
    input: `Plan a ${Number(b.duration ?? 60)}-minute meeting on "${b.topic ?? "our meeting"}" with ${JSON.stringify(b.attendees ?? [])}.`,
  }),
  "web-research": (b) => ({
    instructions:
      "You are a web research assistant. Use web search and return a concise plain-text research brief with key findings. " +
      (b.depth === "comprehensive" ? "Be thorough." : "Be brief."),
    input: `Research: ${b.query ?? ""}`,
    webSearch: true,
  }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const build = OPS[body.operation];
    if (!build) return json({ error: `Unknown operation: ${body.operation}` }, 400);
    if (!hasOpenAIKey()) return json({ error: "OPENAI_API_KEY is not configured" }, 503);
    const spec = build(body);
    const stream = streamResponses({
      ...spec,
      effort: "low",
      maxOutputTokens: body.operation === "web-research" && body.depth === "comprehensive" ? 4000 : 2000,
    });
    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (error) {
    console.error("ai_stream error:", error);
    return json({ error: (error as Error).message ?? "Stream failed" }, 500);
  }
});
