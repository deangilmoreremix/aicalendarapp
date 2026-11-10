import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponses, callResponsesJsonWithData, hasOpenAIKey, extractSources } from "../_shared/openai.ts";

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
      // Public-information enrichment using the OpenAI Responses API web_search tool.
      if (!hasOpenAIKey()) return json({ error: "OPENAI_API_KEY is not configured", fallback: true }, 503);
      const nullableStr = { type: ["string", "null"] };
      const emailDomain = String(contact.email ?? "").split("@")[1]?.toLowerCase();
      try {
        const { value, data } = await callResponsesJsonWithData<Record<string, unknown>>({
          instructions:
            "You are a B2B contact enrichment assistant. Search the public web for professional information about the contact: " +
            "current job title, employer, industry, business location, official profile pages (LinkedIn, X/Twitter, Facebook, Instagram, personal or company website) and a short professional bio. " +
            "Rules: (1) Use only publicly available professional information; never return home addresses, personal phone numbers, personal emails or other private data. " +
            "(2) Verify the person is the right one using the provided email domain, company and title; if several people match or you are unsure, return null for uncertain fields and a low confidence. " +
            "(3) Only return URLs you actually found in search results. (4) Use null for anything unknown. " +
            "(5) confidence is 0-100 for how sure you are that the details describe this exact person. " +
            "(6) summary: 1-3 sentences on what you found and how you matched the person.",
          input: `Find public information for this contact${emailDomain ? ` (email domain: ${emailDomain})` : ""}: ${JSON.stringify({
            name, firstName: contact.firstName, lastName: contact.lastName, email: contact.email, company, title, linkedin: contact.socialProfiles?.linkedin, website: contact.socialProfiles?.website,
          })}`,
          effort: "medium",
          maxOutputTokens: 6000,
          webSearch: { searchContextSize: "medium" },
          toolChoice: "required",
          schema: {
            name: "contact_enrichment",
            schema: {
              type: "object", additionalProperties: false,
              required: ["firstName","lastName","title","company","industry","city","state","country","linkedin","twitter","facebook","instagram","website","bio","summary","confidence"],
              properties: {
                firstName: nullableStr, lastName: nullableStr, title: nullableStr, company: nullableStr, industry: nullableStr,
                city: nullableStr, state: nullableStr, country: nullableStr,
                linkedin: nullableStr, twitter: nullableStr, facebook: nullableStr, instagram: nullableStr, website: nullableStr,
                bio: nullableStr, summary: nullableStr, confidence: { type: "number" },
              },
            },
          },
        });
        return json({ ...value, sources: extractSources(data) });
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
      `No enrichment API key is configured, so this is a best-effort placeholder profile. `;
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
