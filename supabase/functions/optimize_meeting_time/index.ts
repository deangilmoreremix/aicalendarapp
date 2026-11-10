import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponses, callResponsesJson, hasOpenAIKey, extractCitations } from "../_shared/openai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const attendeeIds: string[] = body.attendee_ids ?? [];
    const duration: number = Number(body.duration ?? 60);

    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
      throw new Error("attendee_ids must be a non-empty array");
    }

    if (hasOpenAIKey()) {
      try {
        const out = await callResponsesJson<{ times: string[] }>({
          instructions:
            `You are a scheduling assistant. Today is ${new Date().toISOString()}. Return exactly 3 ISO 8601 datetime strings: the best suggested meeting start times within the next 14 days during business hours.`,
          input: `Suggest ${duration}-minute meeting times for attendees ${JSON.stringify(attendeeIds)}.`,
          maxOutputTokens: 1000,
          schema: { name: "meeting_times", schema: { type: "object", additionalProperties: false, required: ["times"], properties: { times: { type: "array", items: { type: "string" } } } } },
        });
        const times = (out.times ?? []).filter((t) => !Number.isNaN(Date.parse(t)));
        if (times.length) return json(times.slice(0, 5));
      } catch (error) {
        console.error("OpenAI error:", error);
      }
    }

    return new Response(JSON.stringify(buildFallbackTimes()), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("optimize_meeting_time error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Failed to optimize meeting time" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildFallbackTimes(): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(9 + (i % 3) * 2, 0, 0, 0);
    out.push(d.toISOString());
  }
  return out;
}
