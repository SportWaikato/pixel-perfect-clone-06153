import { AchievementInterface } from "../interfaces/AchievementInterface";

export class BadgeImageHelper {
  /**
   * Get the correct image URL for a badge (Supabase storage or public folder)
   */
  static getBadgeImageUrl(achievement: AchievementInterface): string {
    // Priority 1: Supabase storage URL (new system)
    if (achievement.storage_url) {
      return achievement.storage_url;
    }

    // Priority 2: Legacy public folder (backward compatibility)
    if (achievement.image_filename) {
      return `/badges/${achievement.image_filename}`;
    }

    // Fallback: no image
    return "";
  }

  /**
   * Check if badge has any image (storage or legacy)
   */
  static hasBadgeImage(achievement: AchievementInterface): boolean {
    return !!(achievement.storage_url || achievement.image_filename);
  }

  /**
   * Check if badge uses Supabase storage
   */
  static isStorageBased(achievement: AchievementInterface): boolean {
    return !!achievement.storage_url;
  }

  /**
   * Check if badge uses legacy public folder
   */
  static isLegacyBased(achievement: AchievementInterface): boolean {
    return !!achievement.image_filename && !achievement.storage_url;
  }
}
