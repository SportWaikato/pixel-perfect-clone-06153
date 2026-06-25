
import { createSupabaseServer } from '@/models/supabase/services/SupabaseServer';
import { ActivityService } from '@/models/activities/services/ActivityService';
import { UserService } from '@/models/users/services/UserService';

export async function recalculateUserTotals() {
  try {
    const supabase = await createSupabaseServer();
    const userService = new UserService(supabase);
    
    // Get current user
    const user = await userService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get current month's activities only
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: activities, error } = await supabase
      .from('activities')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())
      .limit(500);

    if (error) throw new Error('Failed to fetch activities');

    const currentMonthMinutes = activities?.reduce(
      (sum, activity) => sum + (activity.duration_minutes || 0), 
      0
    ) || 0;
    
    const currentHours = Math.round(currentMonthMinutes / 60 * 10) / 10;
    
    return { 
      success: true, 
      message: `Current month: ${currentHours}h logged` 
    };
  } catch (error) {
    console.error('Error recalculating totals:', error);
    return { success: false, message: 'Failed to recalculate totals' };
  }
} 