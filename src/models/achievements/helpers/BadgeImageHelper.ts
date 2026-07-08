const SUPABASE_BADGES_BASE =
  "https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/";
const CORRECT_PROJECT = "zxxhjkruhwjondrbftaf";

interface BadgeImageFields {
  storage_url?: string | null;
  image_filename?: string | null;
  name?: string | null;
}

function normaliseFilename(raw: string): string {
  let name = raw;
  // Replace .svg with .png (old assets were SVGs, bucket has PNGs)
  if (name.toLowerCase().endsWith(".svg")) {
    name = name.slice(0, -4) + ".png";
  }
  // Convert kebab-case or snake_case to Title Case with spaces
  if (name.includes("-") || name.includes("_")) {
    const base = name.replace(/\.[^.]+$/, "");
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
    name =
      base
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) + ext;
  }
  return name;
}

/** Master map of achievement name → bucket filename for badges whose filename differs from their display name */
const NAME_TO_FILENAME: Record<string, string> = {
  "10 hour hero": "10 Hour Hero.png",
  "100 hour club": "100 Hour Club.png",
  "100 logged entries": "100 Logged Entries.png",
  "14 day warrior": "14 day warrior.png",
  "1 month legend": "30 day legend.png",
  "200 double century": "200 Double Century.png",
  "3 day starter": "3 day starter.png",
  "30 day legend": "30 day legend.png",
  "7 day streak": "7 day streak.png",
  "bring your mate": "Bring your mate.png",
  "challenge accepted": "Challenge Accepted.png",
  "comeback kid": "Comeback Kid.png",
  "connect with nature": "Connect with Nature.png",
  "consistency king": "Consistency King.png",
  "first 5 hours": "First 5 Hours.png",
  "first steps": "First steps.png",
  "getting going": "Getting going.png",
  "hikitea te ha": "Hikitea Te Ha.png",
  "house hero": "House Hero.png",
  "ka pai half century": "Ka Pai Half Century.png",
  "leaderboard champ": "Leaderboard Champ.png",
  "momentum builder": "Momentum Builder.png",
  "movement machine": "Movement Machine.png",
  "movement master": "Movement Master.png",
  "on your bike": "On Your Bike.png",
  "record breaker": "Record Breaker.png",
  "school legend": "School Legend.png",
  "team player": "Team player.png",
  "unstoppable": "Unstoppable.png",
  "variety champion": "Variety Champion.png",
  "walk & talk": "Walk & Talk.png",
  "challenge champions": "Challenge Champions.png",
  "consistency house": "Consistency House.png",
  "most active house": "Most Active House.png",
  "participation champions": "Participation Champions.png",
};

function resolveFilename(badge: BadgeImageFields): string | null {
  // 1. Try name-based lookup first (most reliable)
  if (badge.name) {
    const key = badge.name.toLowerCase().trim();
    const mapped = NAME_TO_FILENAME[key];
    if (mapped) return mapped;
  }
  // 2. Fall back to image_filename with normalisation
  if (badge.image_filename) {
    return normaliseFilename(badge.image_filename);
  }
  return null;
}

export class BadgeImageHelper {
  /**
   * Get the correct image URL for a badge.
   * Priority: storage_url (DB) > name lookup > normalised image_filename > empty
   */
  static getBadgeImageUrl(badge: BadgeImageFields): string {
    // Priority 1: Supabase storage URL — but only if it references the correct project
    if (badge.storage_url && badge.storage_url.includes(CORRECT_PROJECT)) {
      return badge.storage_url;
    }

    // Priority 2: Resolve filename from name map or normalised image_filename
    const filename = resolveFilename(badge);
    if (filename) {
      return `${SUPABASE_BADGES_BASE}${encodeURIComponent(filename)}`;
    }

    // Fallback: no image
    return "";
  }

  /**
   * Check if badge has any image (storage or legacy)
   */
  static hasBadgeImage(badge: BadgeImageFields): boolean {
    return !!(badge.storage_url || badge.image_filename || badge.name);
  }

  /**
   * Check if badge uses Supabase storage
   */
  static isStorageBased(badge: BadgeImageFields): boolean {
    return !!badge.storage_url;
  }

  /**
   * Check if badge uses legacy public folder
   */
  static isLegacyBased(badge: BadgeImageFields): boolean {
    return !!badge.image_filename && !badge.storage_url;
  }
}
