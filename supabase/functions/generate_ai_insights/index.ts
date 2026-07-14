import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactInput {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  company?: string;
  email?: string;
  interest_level?: string;
  status?: string;
  ai_score?: number | null;
}

interface AIInsight {
  id: string;
  type: "engagement" | "conversion" | "risk" | "opportunity";
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedActions: string[];
  createdAt: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const contacts: ContactInput[] = body.contacts ?? [];
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
                  "You are a CRM analyst. Given a list of contacts, return actionable insights as JSON: " +
                  '{ "insights": [ { "type": "engagement"|"conversion"|"risk"|"opportunity", "title": string, "description": string, "confidence": number(0-100), "suggestedActions": string[] } ] }',
              },
              {
                role: "user",
                content: `Analyze these contacts and surface the most valuable insights: ${JSON.stringify(contacts)}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 1200,
          }),
        });
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const insights: AIInsight[] = (parsed.insights ?? []).map((i: any, idx: number) => ({
            id: String(idx + 1),
            type: i.type ?? "opportunity",
            title: i.title ?? "Insight",
            description: i.description ?? "",
            confidence: Number(i.confidence ?? 80),
            actionable: true,
            suggestedActions: i.suggestedActions ?? [],
            createdAt: new Date().toISOString(),
          }));
          if (insights.length) {
            return new Response(JSON.stringify(insights), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (error) {
        console.error("OpenAI error:", error);
      }
    }

    return new Response(JSON.stringify(buildFallbackInsights(contacts)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate_ai_insights error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Failed to generate insights" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildFallbackInsights(contacts: ContactInput[]): AIInsight[] {
  const hot = contacts.filter((c) => c.interest_level === "hot" || (c.ai_score ?? 0) > 80);
  return [
    {
      id: "1",
      type: "opportunity",
      title: "High-Value Prospects Identified",
      description: `${hot.length} contacts show high conversion potential`,
      confidence: 92,
      actionable: true,
      suggestedActions: ["Schedule immediate follow-ups", "Prepare personalized demos"],
      createdAt: new Date().toISOString(),
    },
  ];
}
