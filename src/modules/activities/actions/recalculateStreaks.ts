
import { createSupabaseServer } from '@/models/supabase/services/SupabaseServer';
import { UserService } from '@/models/users/services/UserService';

export async function recalculateUserStreaks() {
  try {
    const supabase = await createSupabaseServer();
    const userService = new UserService(supabase);
    
    // Get current user
    const user = await userService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Recalculate streaks for the current user
    const updatedUser = await userService.recalculateUserStreak(user.id);
    
    if (updatedUser) {
      return { 
        success: true, 
        message: `Streak updated: Current ${updatedUser.current_streak} days, Best ${updatedUser.longest_streak} days` 
      };
    } else {
      return { success: false, message: 'Failed to recalculate streaks' };
    }
  } catch (error) {
    console.error('Error recalculating streaks:', error);
    return { success: false, message: 'Failed to recalculate streaks' };
  }
}

export async function recalculateAllStreaks() {
  try {
    const supabase = await createSupabaseServer();
    const userService = new UserService(supabase);
    
    // Get current user to check if they're admin
    const user = await userService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Only allow admins to recalculate all streaks
    if (user.role !== 'super_admin') {
      throw new Error('Insufficient permissions');
    }

    // Recalculate streaks for all users
    await userService.recalculateAllUserStreaks();
    
    return { 
      success: true, 
      message: 'All user streaks have been recalculated' 
    };
  } catch (error) {
    console.error('Error recalculating all streaks:', error);
    return { success: false, message: 'Failed to recalculate all streaks' };
  }
} 