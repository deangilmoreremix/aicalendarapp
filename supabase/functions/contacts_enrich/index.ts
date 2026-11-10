import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponses, callResponsesJson, hasOpenAIKey, extractCitations } from "../_shared/openai.ts";

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

    if (body.format === "structured") {
      // Structured enrichment with real web search for profile URLs.
      if (!hasOpenAIKey()) return json({ error: "OPENAI_API_KEY is not configured", fallback: true }, 503);
      const nullableStr = { type: ["string", "null"] };
      try {
        const out = await callResponsesJson({
          instructions:
            "You are a B2B contact enrichment assistant. Use web search to find publicly available professional information about the contact. " +
            "Only return values you found evidence for; use null for anything unknown. Never invent URLs, phone numbers or emails. confidence is 0-100.",
          input: `Enrich this contact: ${JSON.stringify(contact)}`,
          maxOutputTokens: 4000,
          webSearch: true,
          schema: {
            name: "contact_enrichment",
            schema: {
              type: "object", additionalProperties: false,
              required: ["firstName","lastName","title","company","industry","city","state","country","linkedin","twitter","facebook","instagram","website","bio","confidence"],
              properties: {
                firstName: nullableStr, lastName: nullableStr, title: nullableStr, company: nullableStr, industry: nullableStr,
                city: nullableStr, state: nullableStr, country: nullableStr,
                linkedin: nullableStr, twitter: nullableStr, facebook: nullableStr, instagram: nullableStr, website: nullableStr,
                bio: nullableStr, confidence: { type: "number" },
              },
            },
          },
        });
        return json(out);
      } catch (error) {
        console.error("OpenAI error:", error);
        return json({ error: error.message ?? "Enrichment failed" }, 502);
      }
    }

    if (hasOpenAIKey()) {
      try {
        const { text } = await callResponses({
          instructions: "You are a B2B contact enrichment assistant. Given partial contact data, produce a concise professional enrichment summary (bio, likely company, suggested social profiles). Only state facts you are confident about; say when unknown. Respond with plain text only.",
          input: `Enrich this contact: ${JSON.stringify(contact)}`,
          maxOutputTokens: 1500,
        });
        return json({ text });
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
