import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkRateLimit, rateLimitExceededMessage, RATE_LIMITS } from "./rate-limit";

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
    const rl = checkRateLimit(context.userId, RATE_LIMITS.generateBadgeImage);
    if (!rl.allowed) throw new Error(rateLimitExceededMessage("generateBadgeImage", rl.resetInMs));

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

// Generates an anonymous survey sentiment report from all survey responses.
// Super-admin only. All respondent data is aggregated — no individual answers
// or user IDs are sent to the AI.
export const generateSurveyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const rl = checkRateLimit(context.userId, RATE_LIMITS.generateSurveyReport);
    if (!rl.allowed)
      throw new Error(rateLimitExceededMessage("generateSurveyReport", rl.resetInMs));

    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (caller?.role !== "super_admin") throw new Error("Forbidden");

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not configured");

    // Fetch all survey responses — anonymised: no user IDs or emails
    const { data: responses, error: fetchErr } = await context.supabase.from("survey_responses")
      .select(`
        answer,
        question:survey_questions(question_text, question_type, display_order),
        survey:surveys(name, survey_type)
      `);

    if (fetchErr) throw new Error(fetchErr.message);
    if (!responses?.length) return { report: "No survey responses submitted yet." };

    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    const responseText = responses
      .map((r: any) => {
        const q = r.question?.question_text || "Unknown question";
        const a = typeof r.answer === "string" ? r.answer : JSON.stringify(r.answer);
        const s = r.survey?.name || "Unknown survey";
        return `[${s}] Q: ${q} A: ${a}`;
      })
      .join("\n");

    const prompt = `You are analysing anonymous survey responses for Karawhiua – Go For It, a school physical activity app built by Sport Waikato.

Below are ALL survey responses from students. No personal data is included — only questions and answers.

Analyse these and produce a concise report with these sections:
1. Overall sentiment — how students feel about the app
2. Common themes — recurring feedback (positive and negative)
3. Feature requests — what students want added or changed
4. Recommendations — what to keep, improve, or remove
5. Key quote — one representative student quote (anonymised)

Keep the report professional, actionable, and no more than 500 words.

--- RESPONSES ---
${responseText.slice(0, 50000)}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return { report: text };
  });

// Extracts activity type and duration in minutes from a workout tracking screenshot.
// Supports Apple Watch, Garmin, Strava, Fitbit, and generic fitness app screenshots.
// Returns activity_type (matching ACTIVITY_TYPES keys) and duration in minutes.
const MAX_SCAN_IMAGE_BASE64_CHARS = 10 * 1024 * 1024; // ~7.5MB decoded

export const scanWorkoutScreenshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { base64Image } = input as { base64Image: string };
    if (!base64Image || typeof base64Image !== "string") throw new Error("base64Image is required");
    if (base64Image.length > MAX_SCAN_IMAGE_BASE64_CHARS)
      throw new Error("Image too large — please upload a screenshot under 7MB");
    return { base64Image };
  })
  .handler(async ({ data, context }) => {
    const rl = checkRateLimit(context.userId, RATE_LIMITS.scanWorkoutScreenshot);
    if (!rl.allowed)
      throw new Error(rateLimitExceededMessage("scanWorkoutScreenshot", rl.resetInMs));
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const { ALL_ACTIVITY_TYPE_LABELS } =
      await import("@/models/activities/interfaces/ActivityInterface");
    const { normalizeWorkoutScan, SCANNABLE_ACTIVITY_TYPES } =
      await import("@/models/ai/utils/normalizeWorkoutScan");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { maxOutputTokens: 200 },
    });

    const mimeMatch = data.base64Image.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,/);
    const mimeType =
      mimeMatch?.[1] === "image/jpg" ? "image/jpeg" : (mimeMatch?.[1] ?? "image/png");
    const base64Data = data.base64Image.replace(/^data:image\/\w+;base64,/, "");

    // The type list is built from the canonical ACTIVITY_TYPES keys so the
    // model can only answer with values the rest of the app understands.
    const typeList = SCANNABLE_ACTIVITY_TYPES.map(
      (key) => `${key} (${ALL_ACTIVITY_TYPE_LABELS[key]})`,
    ).join(", ");

    const prompt = `Look at this workout/fitness-app screenshot and return ONLY a JSON object. No other text.

Available activity types (use the key before the parentheses, exactly as written):
${typeList}

Detect:
1. "activity_type": the best matching key from the list above
2. "duration_minutes": the total workout duration in minutes as a number (e.g. 30)

Return JSON: {"activity_type": "run_jog", "duration_minutes": 30}
If you cannot determine either, return: {"activity_type": null, "duration_minutes": null}`;

    try {
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType, data: base64Data } },
      ]);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return normalizeWorkoutScan(JSON.parse(match[0]));
      return { activity_type: null, duration_minutes: null };
    } catch (err) {
      console.error("scanWorkoutScreenshot error:", (err as Error).message);
      return { activity_type: null, duration_minutes: null };
    }
  });
