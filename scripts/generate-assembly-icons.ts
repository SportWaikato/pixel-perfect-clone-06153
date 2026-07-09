/**
 * Generates brand-coordinated assembly icons using Gemini AI.
 *
 * Usage: npx tsx --env-file=.env scripts/generate-assembly-icons.ts
 * Requires: GOOGLE_AI_API_KEY in .env.
 *
 * Each icon is saved as a PNG with transparent background to
 * public/assembly/. Existing files with matching names are overwritten.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KARAWHIUA_ASSEMBLY_ICON_PROMPT } from "../src/models/ai/prompts/assemblyIconPrompt.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public", "assembly");

const IMAGE_MODEL = "gemini-2.5-flash-image-preview";

interface IconSpec {
  filename: string;
  theme: string;
  subject: string;
}

const MENU_ICONS: IconSpec[] = [
  {
    filename: "icon-house-leaderboard.png",
    theme: "House competition leaderboard ranking",
    subject:
      "A bold podium or ranking bars graphic with three levels, emphasised with magenta top position. Sport medals feel.",
  },
  {
    filename: "icon-top-scorers.png",
    theme: "Top student scorers by house",
    subject:
      "A bold star or flame graphic with upward motion trails in magenta, representing top contributors and high achievement.",
  },
  {
    filename: "icon-prize-draw.png",
    theme: "Spot prize draw / raffle draw",
    subject:
      "A bold gift box or prize trophy with sparkles and magenta celebration accents, fun and exciting.",
  },
  {
    filename: "icon-challenge.png",
    theme: "Weekly challenge / next challenge",
    subject:
      "A bold flag or target graphic with dynamic energy swooshes, representing an upcoming challenge or goal to achieve.",
  },
  {
    filename: "icon-house-badges.png",
    theme: "House badges and achievements earned",
    subject:
      "A bold shield or badge emblem with a star at centre and magenta accent trim, representing house recognition.",
  },
  {
    filename: "icon-house-stats.png",
    theme: "House statistics and data",
    subject:
      "A bold bar chart or stat graph with growing bars in green and magenta accent bar on top, clean and chunky.",
  },
  {
    filename: "icon-school-leaderboard.png",
    theme: "Inter-school competition rankings",
    subject:
      "A bold school building silhouette or interlocked rings with a ranking number 1 in magenta, competition feel.",
  },
  {
    filename: "icon-winners-gallery.png",
    theme: "Past winners gallery",
    subject:
      "A bold photo gallery or framed picture icon with a trophy in the centre frame, celebration and recognition.",
  },
  {
    filename: "icon-school-feed.png",
    theme: "School activity feed and moments",
    subject:
      "A bold activity feed or photo stream icon with multiple cards overlapping and magenta notification dot, social feel.",
  },
];

const PLACE_ICONS: IconSpec[] = [
  {
    filename: "icon-first-place.png",
    theme: "First place gold medal position",
    subject:
      "A bold number 1 inside a gold/champion-style medal badge with laurel leaves and magenta sparkles. Trophy winner feel.",
  },
  {
    filename: "icon-second-place.png",
    theme: "Second place silver position",
    subject:
      "A bold number 2 inside a silver medal badge with clean lines and subtle magenta accent. Runner-up feel.",
  },
  {
    filename: "icon-third-place.png",
    theme: "Third place bronze position",
    subject: "A bold number 3 inside a bronze medal badge. Third place recognition.",
  },
  {
    filename: "icon-fourth-place.png",
    theme: "Fourth place position",
    subject: "A bold number 4 inside a simple recognition badge. Honourable mention feel.",
  },
];

const OTHER_ICONS: IconSpec[] = [
  {
    filename: "icon-ready-to-draw.png",
    theme: "Ready to draw state",
    subject:
      "A bold play button or shuffle icon with magenta glow, representing the prize draw is ready to begin. Exciting, anticipatory.",
  },
];

function resolvePrompt(spec: IconSpec): string {
  return `${KARAWHIUA_ASSEMBLY_ICON_PROMPT}

=== ICON THEME ===
Theme: ${spec.theme}

=== ICON SUBJECT ===
Subject: ${spec.subject}

Create exactly one icon for the "${spec.theme}" theme.`;
}

async function generateIcon(genAI: GoogleGenerativeAI, spec: IconSpec): Promise<Buffer> {
  const model = genAI.getGenerativeModel({
    model: IMAGE_MODEL,
    generationConfig: {
      responseModalities: ["Text", "Image"],
    } as never,
  });

  const prompt = resolvePrompt(spec);
  console.log(`  Generating ${spec.filename}...`);
  const response = await model.generateContent(prompt);
  const parts = response.response?.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error(`No response for ${spec.filename}`);

  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }
  throw new Error(`No image returned for ${spec.filename}`);
}

async function main() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: GOOGLE_AI_API_KEY not set. Use --env-file=.env or set it in your environment.",
    );
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const allIcons = [...MENU_ICONS, ...PLACE_ICONS, ...OTHER_ICONS];
  let generated = 0;
  let skipped = 0;

  for (const spec of allIcons) {
    const outPath = path.join(OUT_DIR, spec.filename);
    try {
      const buffer = await generateIcon(genAI, spec);
      fs.writeFileSync(outPath, buffer);
      console.log(`  -> saved ${spec.filename} (${buffer.length} bytes)`);
      generated++;
    } catch (err) {
      console.error(`  FAILED ${spec.filename}:`, (err as Error).message);
      skipped++;
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped.`);
  console.log(`Icons saved to: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
