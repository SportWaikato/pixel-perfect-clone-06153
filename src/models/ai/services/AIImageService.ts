import { GoogleGenerativeAI } from "@google/generative-ai";
import { KARAWHIUA_BADGE_MASTER_PROMPT } from "@/models/ai/prompts/badgePrompt";

const IMAGE_MODEL = "gemini-2.5-flash-image-preview";

export interface BadgeGenerationResult {
  imageBlob: Blob;
  filename: string;
}

export class AIImageService {
  private genAI: GoogleGenerativeAI;

  // SECURITY: server-only. Never read a VITE_-prefixed key here — anything
  // VITE_-prefixed is bundled into client JS. Badge generation for the admin
  // UI goes through the authenticated server function in src/lib/ai.functions.ts.
  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_AI_API_KEY;
    if (!key) {
      throw new Error("Google AI API key is not configured. Set GOOGLE_AI_API_KEY (server-side)");
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  async generateBadge(
    badgeName: string,
    badgeDescription?: string,
    iconContext?: string,
  ): Promise<BadgeGenerationResult> {
    const contextPart = iconContext ? `\nIcon suggestion: ${iconContext}.` : "";

    const descriptionPart = badgeDescription ? `\nDescription: ${badgeDescription}.` : "";

    const prompt = `${KARAWHIUA_BADGE_MASTER_PROMPT}

Badge name: ${badgeName}${descriptionPart}${contextPart}

Create exactly one badge for "${badgeName}".`;

    const model = this.genAI.getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: {
        responseModalities: ["Text", "Image"],
      } as any,
    });

    const response = await model.generateContent(prompt);

    const parts = response.response?.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("No response from AI model");
    }

    for (const part of parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || "image/png";
        const byteChars = atob(base64Data);
        const byteArrays = [];
        for (let i = 0; i < byteChars.length; i++) {
          byteArrays.push(byteChars.charCodeAt(i));
        }
        const imageBlob = new Blob([new Uint8Array(byteArrays)], { type: mimeType });
        const ext = mimeType === "image/png" ? "png" : mimeType.split("/")[1] || "png";
        const filename = `ai-generated-${Date.now()}.${ext}`;
        return { imageBlob, filename };
      }
    }

    throw new Error("AI model did not return an image. Try again.");
  }
}
