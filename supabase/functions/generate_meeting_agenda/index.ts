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
    const title: string = body.title ?? "Meeting";
    const attendees: string[] = body.attendees ?? [];

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
                  "You are a meeting facilitator. Given a meeting title and attendees, return ONLY a JSON array of short agenda item strings (5-7 items).",
              },
              {
                role: "user",
                content: `Build an agenda for \"${title}\" with attendees ${JSON.stringify(attendees)}.`,
              },
            ],
            temperature: 0.4,
            max_tokens: 400,
          }),
        });
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length) {
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
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
