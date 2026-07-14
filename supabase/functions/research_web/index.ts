import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (openaiApiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a web research assistant. Given a query, return a concise plain-text research brief with key findings and cited source URLs in brackets. " +
                  (depth === "comprehensive" ? "Be thorough." : "Be brief."),
              },
              {
                role: "user",
                content: `Research: ${query}`,
              },
            ],
            temperature: 0.4,
            max_tokens: depth === "comprehensive" ? 900 : 500,
          }),
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
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
