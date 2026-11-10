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

    const out = await callResponsesJson<{ score: number; reasoning: string; nextBestAction: string; fitScore: number; engagementScore: number; conversionProbability: number; urgencyScore: number }>({
      instructions:
        "You are a lead-scoring analyst. Score the contact 0-100 for sales potential based on seniority, company, engagement, source and social presence. " +
        "Also score fit, engagement, conversion probability and urgency (each 0-100), give a one-sentence reasoning and one concrete next best action. Base everything only on the data provided.",
      input: `Score this contact: ${JSON.stringify(contact)}`,
      maxOutputTokens: 1500,
      schema: {
        name: "contact_score",
        schema: {
          type: "object", additionalProperties: false, required: ["score", "reasoning", "nextBestAction", "fitScore", "engagementScore", "conversionProbability", "urgencyScore"],
          properties: { score: { type: "number" }, reasoning: { type: "string" }, nextBestAction: { type: "string" }, fitScore: { type: "number" }, engagementScore: { type: "number" }, conversionProbability: { type: "number" }, urgencyScore: { type: "number" } },
        },
      },
    });
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    return json({ ...out, score: clamp(out.score), fitScore: clamp(out.fitScore), engagementScore: clamp(out.engagementScore), conversionProbability: clamp(out.conversionProbability), urgencyScore: clamp(out.urgencyScore) });
  } catch (error) {
    console.error("contacts_score error:", error);
    return json({ error: error.message ?? "Failed to score contact" }, 500);
  }
});
