import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponses, callResponsesJson, hasOpenAIKey, extractCitations } from "../_shared/openai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const contactId: string | undefined = body.contact_id;
    const dealValue: number = Number(body.deal_value ?? 0);

    if (!contactId) {
      throw new Error("contact_id is required");
    }

    if (hasOpenAIKey()) {
      try {
        const out = await callResponsesJson<{ probability: number }>({
          instructions: "You are a sales forecasting model. Given a contact and a deal value, estimate the probability (0-100) that the deal closes successfully.",
          input: `Predict deal success probability for contact ${contactId} with deal value ${dealValue}.`,
          maxOutputTokens: 500,
          schema: { name: "deal_probability", schema: { type: "object", additionalProperties: false, required: ["probability"], properties: { probability: { type: "number" } } } },
        });
        if (Number.isFinite(out.probability)) {
          return json(Math.max(5, Math.min(95, Math.round(out.probability))));
        }
      } catch (error) {
        console.error("OpenAI error:", error);
      }
    }

    let probability = 50;
    if (dealValue > 100000) probability += 15;
    else if (dealValue > 50000) probability += 10;
    else if (dealValue > 10000) probability += 5;
    probability += (Math.random() - 0.5) * 20;

    return new Response(JSON.stringify(Math.max(10, Math.min(95, Math.round(probability)))), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("predict_deal_success error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Failed to predict deal success" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
