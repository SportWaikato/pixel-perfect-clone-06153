import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server-side badge generation. The Gemini API key must stay server-only
// (GOOGLE_AI_API_KEY, NOT VITE_-prefixed) — a client-side key ships to every
// visitor in the JS bundle.
export const generateBadgeImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { badgeName, badgeDescription, iconContext } = input as {
      badgeName: string;
      badgeDescription?: string;
      iconContext?: string;
    };
    if (!badgeName || typeof badgeName !== "string") throw new Error("badgeName required");
    const clamp = (v: unknown, max: number) =>
      typeof v === "string" ? v.trim().slice(0, max) : undefined;
    return {
      badgeName: badgeName.trim().slice(0, 120),
      badgeDescription: clamp(badgeDescription, 500),
      iconContext: clamp(iconContext, 200),
    };
  })
  .handler(async ({ data, context }) => {
    // Badge management is a super-admin feature.
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (caller?.role !== "super_admin") throw new Error("Forbidden");

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not configured on the server");

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const { KARAWHIUA_BADGE_MASTER_PROMPT } = await import("@/models/ai/prompts/badgePrompt");

    const contextPart = data.iconContext ? `\nIcon suggestion: ${data.iconContext}.` : "";
    const descriptionPart = data.badgeDescription ? `\nDescription: ${data.badgeDescription}.` : "";
    const prompt = `${KARAWHIUA_BADGE_MASTER_PROMPT}

Badge name: ${data.badgeName}${descriptionPart}${contextPart}

Create exactly one badge for "${data.badgeName}".`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        responseModalities: ["Text", "Image"],
      } as never,
    });

    const response = await model.generateContent(prompt);
    const parts = response.response?.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No response from AI model");

    for (const part of parts) {
      if (part.inlineData) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        };
      }
    }
    throw new Error("AI model did not return an image. Try again.");
  });
