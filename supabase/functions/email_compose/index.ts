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
    const recipient = body.recipient ?? {};
    const context: string = body.context ?? "";

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
                  "You are an email copywriting assistant. Given a recipient and context, compose a concise, professional, personalized email. Respond with plain text only (no subject line needed separately).",
              },
              {
                role: "user",
                content: `Compose an email for ${JSON.stringify(recipient)}. Context: ${context}`,
              },
            ],
            temperature: 0.6,
            max_tokens: 600,
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

    const name = recipient.firstName ?? recipient.name ?? "there";
    const fallback =
      `Hi ${name},\n\n` +
      `Thanks for connecting. ${context ? context + " " : ""}I'd love to follow up and see how we can help you achieve your goals.\n\n` +
      `Best regards,\nYour Team`;
    return new Response(JSON.stringify({ text: fallback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("email_compose error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Failed to compose email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
