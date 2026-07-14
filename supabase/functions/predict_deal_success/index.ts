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
    const contactId: string | undefined = body.contact_id;
    const dealValue: number = Number(body.deal_value ?? 0);

    if (!contactId) {
      throw new Error("contact_id is required");
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
                  "You are a sales forecasting model. Given a contact context and a deal value, return ONLY a JSON number (0-100) representing the probability the deal will close successfully.",
              },
              {
                role: "user",
                content: `Predict deal success probability for contact ${contactId} with deal value ${dealValue}. Respond with only the number.`,
              },
            ],
            temperature: 0.2,
            max_tokens: 20,
          }),
        });
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        const parsed = parseFloat(content.replace(/[^0-9.]/g, ""));
        if (!Number.isNaN(parsed)) {
          const probability = Math.max(5, Math.min(95, Math.round(parsed)));
          return new Response(JSON.stringify(probability), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (error) {
        console.error("OpenAI error:", error);
      }
    }

    let probability = 50;
    if (dealValue > 100000) probability += 15;
    else if (dealValue > 50000) probability += 10;
    else if (dealValue > 10000) probability += 5;
    probability += (Math.random() - 0.5) * 20;

    return new Response(JSON.stringify(Math.max(10, Math.min(95, Math.round(probability)))), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("predict_deal_success error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Failed to predict deal success" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
