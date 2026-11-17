import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callImages, hasOpenAIKey } from "../_shared/openai.ts";

/** Generates a profile image with the OpenAI Images API and stores it in the Supabase `avatars` bucket. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const contact = body.contact ?? {};
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.name;
    if (!name) throw new Error("contact name is required");
    if (!hasOpenAIKey()) return json({ error: "OPENAI_API_KEY is not configured" }, 503);

    const role = [contact.title, contact.company].filter(Boolean).join(" at ");
    const prompt =
      `A clean, friendly, professional profile avatar illustration for ${name}${role ? `, ${role}` : ""}. ` +
      `Head-and-shoulders, soft neutral background, modern flat style, centered, no text, no logos.`;

    const image = await callImages({
      prompt,
      size: "1024x1024",
      quality: "medium",
      outputFormat: "webp",
      safetyIdentifier: String(contact.id ?? "anonymous"),
    });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const path = `${contact.id ?? crypto.randomUUID()}/${Date.now()}.webp`;
    const { error } = await supabase.storage.from("avatars").upload(path, image.bytes, {
      contentType: image.contentType,
      upsert: true,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return json({ url: data.publicUrl });
  } catch (error) {
    console.error("contacts_image error:", error);
    return json({ error: error.message ?? "Failed to generate image" }, 500);
  }
});
