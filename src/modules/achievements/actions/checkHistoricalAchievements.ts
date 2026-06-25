
import { createSupabaseServer } from '@/models/supabase/services/SupabaseServer';
import { AchievementService } from '@/models/achievements/services/AchievementService';
import { UserService } from '@/models/users/services/UserService';

export async function checkHistoricalAchievements(userId?: string) {
  try {
    const supabase = await createSupabaseServer();
    const achievementService = new AchievementService(supabase);
    
    // If no userId provided, get current user
    if (!userId) {
      const userService = new UserService(supabase);
      const user = await userService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated'
        };
      }
      userId = user.id;
    }

    // Check and award historical achievements
    const historicalAchievements = await achievementService.checkHistoricalAchievements(userId);
    
    // Also check event-based achievements
    const eventBasedAchievements = await achievementService.checkEventBasedAchievements(userId);
    
    const totalNewAchievements = historicalAchievements.length + eventBasedAchievements.length;

    return {
      success: true,
      message: `Checked all achievements. Awarded ${totalNewAchievements} new achievements (${historicalAchievements.length} historical, ${eventBasedAchievements.length} event-based).`,
      newAchievements: [...historicalAchievements, ...eventBasedAchievements]
    };
  } catch (error) {
    console.error('Error checking historical achievements:', error);
    return {
      success: false,
      message: 'Failed to check historical achievements'
    };
  }
} 