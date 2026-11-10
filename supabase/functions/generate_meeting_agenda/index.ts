import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponses, callResponsesJson, hasOpenAIKey, extractCitations } from "../_shared/openai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const title: string = body.title ?? "Meeting";
    const attendees: string[] = body.attendees ?? [];

    if (hasOpenAIKey()) {
      try {
        const out = await callResponsesJson<{ items: string[] }>({
          instructions: "You are a meeting facilitator. Given a meeting title and attendees, return 5-7 short agenda item strings.",
          input: `Build an agenda for "${title}" with attendees ${JSON.stringify(attendees)}.`,
          maxOutputTokens: 1500,
          schema: { name: "agenda", schema: { type: "object", additionalProperties: false, required: ["items"], properties: { items: { type: "array", items: { type: "string" } } } } },
        });
        if (out.items?.length) return json(out.items);
      } catch (error) {
        console.error("OpenAI error:", error);
      }
    }

    return new Response(
      JSON.stringify([
        "Welcome and introductions (5 min)",
        "Agenda review and objectives (5 min)",
        `Discussion: ${title} (30 min)`,
        "Q&A and open discussion (15 min)",
        "Next steps and action items (10 min)",
        "Closing and follow-up planning (5 min)",
      ]),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate_meeting_agenda error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Failed to generate meeting agenda" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
