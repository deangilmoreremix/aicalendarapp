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
    const attendeeIds: string[] = body.attendee_ids ?? [];
    const duration: number = Number(body.duration ?? 60);

    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
      throw new Error("attendee_ids must be a non-empty array");
    }

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
                  "You are a scheduling assistant. Given attendee ids and a meeting duration in minutes, return ONLY a JSON array of ISO 8601 datetime strings (length 3) representing the best suggested meeting start times within the next 14 days during business hours.",
              },
              {
                role: "user",
                content: `Suggest ${duration}-minute meeting times for attendees ${JSON.stringify(attendeeIds)}.`,
              },
            ],
            temperature: 0.3,
            max_tokens: 300,
          }),
        });
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length) {
          return new Response(JSON.stringify(parsed.slice(0, 5)), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
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
