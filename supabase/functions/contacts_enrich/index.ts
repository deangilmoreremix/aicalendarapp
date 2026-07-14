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
    const contact = body.contact ?? {};
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.name || "the contact";
    const company = contact.company ?? "";
    const title = contact.title ?? "";

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
                  "You are a B2B contact enrichment assistant. Given partial contact data, produce a concise professional enrichment summary (bio, likely company, suggested social profiles). Respond with plain text only.",
              },
              {
                role: "user",
                content: `Enrich this contact: ${JSON.stringify(contact)}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 500,
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

    const fallback = `${name} is a ${title || "professional"}${company ? ` at ${company}` : ""}. ` +
      `No enrichment API key is configured, so this is a best-effort placeholder profile. ` +
      `Likely social profiles: https://linkedin.com/in/${String(name).toLowerCase().replace(/[^a-z]+/g, "-")}.`;
    return new Response(JSON.stringify({ text: fallback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("contacts_enrich error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Failed to enrich contact" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
