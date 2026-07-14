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
    const attendees: string[] = body.attendees ?? [];
    const duration: number = Number(body.duration ?? 60);
    const topic: string = body.topic ?? "our meeting";

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
                  "You are a meeting planning assistant. Given attendees, duration and topic, return a short plain-text plan: objectives, agenda, and prep items. Respond with plain text only.",
              },
              {
                role: "user",
                content: `Plan a ${duration}-minute meeting on \"${topic}\" with ${JSON.stringify(attendees)}.`,
              },
            ],
            temperature: 0.5,
            max_tokens: 500,
          }),
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
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
