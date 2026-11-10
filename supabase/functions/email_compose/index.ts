import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponses, callResponsesJson, hasOpenAIKey, extractCitations } from "../_shared/openai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const recipient = body.recipient ?? {};
    const context: string = body.context ?? "";

    if (hasOpenAIKey()) {
      try {
        const { text } = await callResponses({
          instructions: "You are an email copywriting assistant. Given a recipient and context, compose a concise, professional, personalized email. Respond with plain text only (no subject line needed separately).",
          input: `Compose an email for ${JSON.stringify(recipient)}. Context: ${context}`,
          maxOutputTokens: 1500,
        });
        return json({ text });
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
