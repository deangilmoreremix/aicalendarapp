import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callResponses, callResponsesJson, hasOpenAIKey, extractCitations } from "../_shared/openai.ts";

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
    if (hasOpenAIKey()) {
      try {
        const parsed = await callResponsesJson<{ insights: any[] }>({
          instructions: "You are a CRM analyst. Given a list of contacts, return the most valuable actionable insights.",
          input: `Analyze these contacts and surface the most valuable insights: ${JSON.stringify(contacts)}`,
          maxOutputTokens: 4000,
          schema: { name: "insights", schema: { type: "object", additionalProperties: false, required: ["insights"], properties: { insights: { type: "array", items: { type: "object", additionalProperties: false, required: ["type","title","description","confidence","suggestedActions"], properties: { type: { type: "string", enum: ["engagement","conversion","risk","opportunity"] }, title: { type: "string" }, description: { type: "string" }, confidence: { type: "number" }, suggestedActions: { type: "array", items: { type: "string" } } } } } } } },
        });
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
        if (insights.length) return json(insights);
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
