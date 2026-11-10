import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponsesJson, hasOpenAIKey } from "../_shared/openai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const contact = body.contact;
    if (!contact || typeof contact !== "object") throw new Error("contact is required");
    if (!hasOpenAIKey()) return json({ error: "OPENAI_API_KEY is not configured", fallback: true }, 503);

    const out = await callResponsesJson<{ score: number; reasoning: string; nextBestAction: string }>({
      instructions:
        "You are a lead-scoring analyst. Score the contact 0-100 for sales potential based on seniority, company, engagement, source and social presence. " +
        "Give a one-sentence reasoning and one concrete next best action.",
      input: `Score this contact: ${JSON.stringify(contact)}`,
      maxOutputTokens: 1500,
      schema: {
        name: "contact_score",
        schema: {
          type: "object", additionalProperties: false, required: ["score", "reasoning", "nextBestAction"],
          properties: { score: { type: "number" }, reasoning: { type: "string" }, nextBestAction: { type: "string" } },
        },
      },
    });
    return json({ ...out, score: Math.max(0, Math.min(100, Math.round(out.score))) });
  } catch (error) {
    console.error("contacts_score error:", error);
    return json({ error: error.message ?? "Failed to score contact" }, 500);
  }
});
