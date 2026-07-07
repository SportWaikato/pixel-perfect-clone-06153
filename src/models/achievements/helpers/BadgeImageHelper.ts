const SUPABASE_BADGES_BASE =
  "https://zxxhjkruhwjondrbftaf.supabase.co/storage/v1/object/public/badges/";

interface BadgeImageFields {
  storage_url?: string | null;
  image_filename?: string | null;
}

export class BadgeImageHelper {
  /**
   * Get the correct image URL for a badge.
   * Priority: storage_url (DB) > Supabase bucket inferred from image_filename > empty
   */
  static getBadgeImageUrl(badge: BadgeImageFields): string {
    // Priority 1: Supabase storage URL (explicitly set in DB)
    if (badge.storage_url) {
      return badge.storage_url;
    }

    // Priority 2: Infer Supabase bucket URL from image_filename
    if (badge.image_filename) {
      return `${SUPABASE_BADGES_BASE}${encodeURIComponent(badge.image_filename)}`;
    }

    // Fallback: no image
    return "";
  }

  /**
   * Check if badge has any image (storage or legacy)
   */
  static hasBadgeImage(badge: BadgeImageFields): boolean {
    return !!(badge.storage_url || badge.image_filename);
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
