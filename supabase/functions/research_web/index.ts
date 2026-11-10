import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponses, callResponsesJson, hasOpenAIKey, extractCitations } from "../_shared/openai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const query: string = body.query ?? "";
    const depth: string = body.depth ?? "basic";

    if (!query) {
      throw new Error("query is required");
    }

    if (hasOpenAIKey()) {
      try {
        const { text, data } = await callResponses({
          instructions:
            "You are a web research assistant. Use web search and return a concise plain-text research brief with key findings. " +
            (depth === "comprehensive" ? "Be thorough." : "Be brief."),
          input: `Research: ${query}`,
          maxOutputTokens: depth === "comprehensive" ? 4000 : 2000,
          webSearch: true,
        });
        return json({ text, citations: extractCitations(data) });
      } catch (error) {
        console.error("OpenAI error:", error);
      }
    }

    const fallback =
      `Research brief for "${query}"\n\n` +
      `No research API key is configured, so this is a placeholder summary. ` +
      `In production this endpoint calls an LLM with web access to return cited findings.`;
    return new Response(JSON.stringify({ text: fallback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("research_web error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Failed to research" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
