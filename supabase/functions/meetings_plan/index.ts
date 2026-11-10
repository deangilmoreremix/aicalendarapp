import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponses, callResponsesJson, hasOpenAIKey, extractCitations } from "../_shared/openai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const attendees: string[] = body.attendees ?? [];
    const duration: number = Number(body.duration ?? 60);
    const topic: string = body.topic ?? "our meeting";

    if (hasOpenAIKey()) {
      try {
        const { text } = await callResponses({
          instructions: "You are a meeting planning assistant. Given attendees, duration and topic, return a short plain-text plan: objectives, agenda, and prep items. Respond with plain text only.",
          input: `Plan a ${duration}-minute meeting on "${topic}" with ${JSON.stringify(attendees)}.`,
          maxOutputTokens: 1500,
        });
        return json({ text });
      } catch (error) {
        console.error("OpenAI error:", error);
      }
    }

    const fallback =
      `Meeting plan for "${topic}" (${duration} min)\n\n` +
      `Objectives:\n- Align on goals\n- Define owners and next steps\n\n` +
      `Agenda:\n1. Intro (5 min)\n2. Topic discussion (${Math.max(10, duration - 20)} min)\n3. Action items (10 min)\n\n` +
      `Prep: review attendee context and share agenda in advance.`;
    return new Response(JSON.stringify({ text: fallback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("meetings_plan error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Failed to plan meeting" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
