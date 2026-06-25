import { SupabaseClient } from '@supabase/supabase-js';
import { ActivityInterface } from '../interfaces/ActivityInterface';
import { AchievementService } from '@/models/achievements/services/AchievementService';
import { calculateBasePoints, calculatePointsWithMultiplier, calculateFixedChallengePoints } from '../utils/calculatePoints';
import { MAX_ACTIVITY_DURATION_MINUTES, MAX_ACTIVITY_DAYS_AGO, MAX_ACTIVITIES_PER_DAY } from '../constants/activityValidationConstants';

const TABLE_NAME = 'activities';
const USERS_TABLE = 'users';
const ACTIVITY_LIMIT_ERROR = `Something isn't right. Please ensure your activity is less than ${MAX_ACTIVITY_DURATION_MINUTES} minutes, within the last ${MAX_ACTIVITY_DAYS_AGO} days, and that you haven't exceeded ${MAX_ACTIVITIES_PER_DAY} logs for the day.`;

export class ActivityService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async create(activityData: Partial<ActivityInterface>): Promise<ActivityInterface> {
    // Rule 1: Max duration per activity
    if (activityData.duration_minutes && activityData.duration_minutes > MAX_ACTIVITY_DURATION_MINUTES) {
      throw new Error(ACTIVITY_LIMIT_ERROR);
    }

    // Determine activity timestamp for date-based rules
    const activityTimestamp = activityData.created_at
      ? new Date(activityData.created_at as string)
      : new Date();

    // Rule 2: Activity date must be within the allowed window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_ACTIVITY_DAYS_AGO);
    cutoffDate.setHours(0, 0, 0, 0);
    if (activityTimestamp < cutoffDate) {
      throw new Error(ACTIVITY_LIMIT_ERROR);
    }

    // Rule 3: Max 3 activities per day (by NZ calendar day)
    // Derive the NZ date string using the same fixed +12 offset used throughout the codebase
    const activityDateNZ = activityData.created_at
      ? (activityData.created_at as string).substring(0, 10)
      : new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(new Date());

    const dayStart = new Date(`${activityDateNZ}T00:00:00+12:00`).toISOString();
    const dayEnd = new Date(`${activityDateNZ}T23:59:59+12:00`).toISOString();

    const { count } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', activityData.user_id)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd);

    if ((count ?? 0) >= MAX_ACTIVITIES_PER_DAY) {
      throw new Error(ACTIVITY_LIMIT_ERROR);
    }

    // Ensure duration_minutes is provided
    if (!activityData.duration_minutes) {
      throw new Error('Duration in minutes is required');
    }

    // Calculate base points
    const basePoints = calculateBasePoints(activityData.duration_minutes);

    // Get event points config if event_id is provided
    let pointsCalculation = calculatePointsWithMultiplier(basePoints);
    let housePoints = basePoints;

    if (activityData.event_id) {
      const { data: event } = await this.supabaseClient
        .from('events')
        .select('name, points_multiplier, challenge_points')
        .eq('id', activityData.event_id)
        .single();

      if (event?.challenge_points) {
        pointsCalculation = calculateFixedChallengePoints(basePoints, event.challenge_points);
        housePoints = basePoints;
      } else {
        const eventMultiplier = event?.points_multiplier || 1.0;
        pointsCalculation = calculatePointsWithMultiplier(basePoints, eventMultiplier);
      }
    }

    // Create the activity with challenge points data
    const { data: activity, error: activityError } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert({
        ...activityData,
        custom_activity_name: activityData.custom_activity_name || null,
        house_points_awarded: housePoints,
        ...pointsCalculation
      })
      .select(`
        *,
        user:users(username, first_name, last_name, house:houses(*)),
        event:events(id, name, points_multiplier)
      `)
      .single();

    if (activityError) throw new Error(activityError.message);

    // User totals are automatically updated by database triggers
    // No manual update needed - trigger_update_user_total_minutes handles this

    // Run streak recalculation and achievement checks in parallel
    if (activity?.user_id) {
      await Promise.all([
        Promise.resolve(this.supabaseClient.rpc('update_user_streak_for_date', {
          p_user_id: activity.user_id,
          p_activity_date: new Date(activity.created_at).toISOString().split('T')[0]
        })).catch((err: unknown) => console.error('Error updating user streak:', err)),

        (async () => {
          try {
            const achievementService = new AchievementService(this.supabaseClient);
            const [newAchievements, historicalAchievements] = await Promise.all([
              achievementService.checkAndAwardAchievements(activity.user_id, {
                activity_type: activity.activity_type,
                duration_minutes: activity.duration_minutes,
                participation_type: activity.participation_type,
                created_at: activity.created_at,
                event_id: activity.event_id,
              }),
              achievementService.checkHistoricalAchievements(activity.user_id),
            ]);
            if (newAchievements.length > 0) {
              console.log(`User ${activity.user_id} earned ${newAchievements.length} new real-time achievements!`);
            }
            if (historicalAchievements.length > 0) {
              console.log(`User ${activity.user_id} earned ${historicalAchievements.length} new historical achievements!`);
            }
          } catch (error) {
            console.error('Error checking achievements:', error);
          }
        })(),
      ]);
    }

    return activity;
  }

  async getById(id: string): Promise<ActivityInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        user:users(username, first_name, last_name, house:houses(*)),
        event:events(id, name, points_multiplier)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(error.message);
    }
    return data;
  }

  async getByUserId(userId: string, limit = 10): Promise<ActivityInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        user:users(username, first_name, last_name, house:houses(*))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getRecentActivities(limit = 20): Promise<ActivityInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        user:users!inner(username, first_name, last_name, house:houses(*))
      `)
      .eq('users.is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async update(id: string, userId: string, activityData: Partial<ActivityInterface>): Promise<ActivityInterface> {
    // First verify the activity belongs to the user
    const existingActivity = await this.getById(id);
    if (!existingActivity) {
      throw new Error('Activity not found');
    }
    if (existingActivity.user_id !== userId) {
      throw new Error('You can only edit your own activities');
    }

    // Rule: Max duration per activity
    if (activityData.duration_minutes !== undefined && activityData.duration_minutes > MAX_ACTIVITY_DURATION_MINUTES) {
      throw new Error(ACTIVITY_LIMIT_ERROR);
    }

    // Rule: Activity date must be within the allowed window
    if (activityData.created_at) {
      const activityTimestamp = new Date(activityData.created_at as string);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - MAX_ACTIVITY_DAYS_AGO);
      cutoffDate.setHours(0, 0, 0, 0);
      if (activityTimestamp < cutoffDate) {
        throw new Error(ACTIVITY_LIMIT_ERROR);
      }
    }

    // Ensure duration_minutes is provided if being updated
    if (activityData.duration_minutes !== undefined && !activityData.duration_minutes) {
      throw new Error('Duration in minutes is required');
    }

    // Calculate new points if duration or event changed
    let pointsCalculation = null;
    let housePoints: number | null = null;
    if (activityData.duration_minutes !== undefined || activityData.event_id !== undefined) {
      const duration = activityData.duration_minutes || existingActivity.duration_minutes || 0;
      const basePoints = calculateBasePoints(duration);
      const eventId = activityData.event_id !== undefined ? activityData.event_id : existingActivity.event_id;

      if (eventId) {
        const { data: event } = await this.supabaseClient
          .from('events')
          .select('name, points_multiplier, challenge_points')
          .eq('id', eventId)
          .single();

        if (event?.challenge_points) {
          pointsCalculation = calculateFixedChallengePoints(basePoints, event.challenge_points);
          housePoints = basePoints;
        } else {
          const eventMultiplier = event?.points_multiplier || 1.0;
          pointsCalculation = calculatePointsWithMultiplier(basePoints, eventMultiplier);
          housePoints = basePoints;
        }
      } else {
        pointsCalculation = calculatePointsWithMultiplier(basePoints);
        housePoints = basePoints;
      }
    }

    // Update the activity
    const updateData = {
      ...activityData,
      custom_activity_name: activityData.custom_activity_name || null,
      ...(pointsCalculation && {
        house_points_awarded: housePoints,
        ...pointsCalculation
      })
    };

    const { data: activity, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users(username, first_name, last_name, house:houses(*)),
        event:events(id, name, points_multiplier)
      `)
      .single();

    if (error) throw new Error(error.message);

    // User totals are automatically updated by database triggers
    // Check for achievements if activity changed significantly
    if (activity && (pointsCalculation || activityData.activity_type)) {
      try {
        const achievementService = new AchievementService(this.supabaseClient);
        await achievementService.checkHistoricalAchievements(activity.user_id);
      } catch (error) {
        console.error('Error checking achievements after update:', error);
      }
    }

    return activity;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existingActivity = await this.getById(id);

    if (!existingActivity) {
      throw new Error('Activity not found');
    }

    if (existingActivity.user_id !== userId) {
      throw new Error('You can only delete your own activities');
    }

    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    try {
      await this.recalculateUserTotals(existingActivity.user_id);
    } catch (recalculateError) {
      console.error('Error recalculating user totals after delete:', recalculateError);
    }

    try {
      await this.supabaseClient.rpc('update_user_streak_for_date', {
        p_user_id: existingActivity.user_id,
        p_activity_date: new Date(existingActivity.created_at).toISOString().split('T')[0],
      });
    } catch (streakError) {
      console.error('Error updating user streak after delete:', streakError);
    }
  }

  async getActivitiesForSchool(schoolId: string | null, limit = 50, offset = 0): Promise<ActivityInterface[]> {
    const getNZDate = (isoString: string) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(new Date(isoString));

    // Resolve user IDs for the given school (null = all schools, no filter)
    let userIds: string[] | null = null;
    if (schoolId) {
      const { data: schoolUsers } = await this.supabaseClient
        .from('users')
        .select('id')
        .eq('school_id', schoolId)
        .eq('is_deleted', false);
      userIds = (schoolUsers || []).map((u: { id: string }) => u.id);
      if (userIds.length === 0) return [];
    }

    // Step 1: Fetch recent activities (last 30 days) for daily totals computation.
    // Limiting to 30 days keeps this query fast; flagged days older than that are
    // rarely actioned and will be re-flagged if the activity reappears in the window.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyBaseQuery = this.supabaseClient
      .from(TABLE_NAME)
      .select('user_id, created_at, duration_minutes')
      .gte('created_at', thirtyDaysAgo.toISOString());
    const { data: allActivities } = await (
      userIds ? dailyBaseQuery.in('user_id', userIds) : dailyBaseQuery
    );

    // Step 2: Compute daily totals per user (NZ date) — flag days with ≥540 min
    const flaggedDays = new Set<string>();
    const dailyTotals = new Map<string, number>();
    for (const a of allActivities || []) {
      const key = `${a.user_id}|${getNZDate(a.created_at)}`;
      dailyTotals.set(key, (dailyTotals.get(key) || 0) + (a.duration_minutes || 0));
    }
    for (const [key, total] of dailyTotals) {
      if (total >= 540) flaggedDays.add(key);
    }

    // Step 3: Fetch paginated activities with full user info
    const pageBaseQuery = this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        user:users!inner(id, username, first_name, last_name, school_id, house:houses(*))
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    const { data, error } = await (
      userIds ? pageBaseQuery.in('user_id', userIds) : pageBaseQuery
    );

    if (error) throw new Error(error.message);

    // Step 4: Annotate with is_flagged
    return (data || []).map(activity => ({
      ...activity,
      is_flagged: flaggedDays.has(`${activity.user_id}|${getNZDate(activity.created_at)}`) && !activity.is_rejected,
    }));
  }

  async rejectActivity(activityId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({ is_rejected: true })
      .eq('id', activityId);

    if (error) throw new Error(error.message);
  }

  async rejectActivities(activityIds: string[]): Promise<void> {
    if (activityIds.length === 0) return;
    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({ is_rejected: true })
      .in('id', activityIds);

    if (error) throw new Error(error.message);
  }

  async restoreActivity(activityId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({ is_rejected: false })
      .eq('id', activityId);

    if (error) throw new Error(error.message);
  }

  async recalculateUserTotals(userId: string): Promise<void> {
    // Get sum of all activity minutes for the user (excluding rejected)
    const { data: activities, error: activitiesError } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('duration_minutes')
      .eq('user_id', userId)
      .eq('is_rejected', false);

    if (activitiesError) throw new Error(activitiesError.message);

    const totalMinutes = activities?.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0) || 0;

    // Update user's total
    const { error: updateError } = await this.supabaseClient
      .from(USERS_TABLE)
      .update({ total_minutes: totalMinutes })
      .eq('id', userId);

    if (updateError) throw new Error(updateError.message);
  }

  async recalculateSchoolAndHouseTotals(): Promise<void> {
    try {
      // Recalculate all school totals
      const { error: schoolError } = await this.supabaseClient
        .rpc('recalculate_school_totals');
      
      if (schoolError) {
        console.error('Error recalculating school totals:', schoolError);
      }

      // Recalculate all house totals  
      const { error: houseError } = await this.supabaseClient
        .rpc('recalculate_house_totals');
        
      if (houseError) {
        console.error('Error recalculating house totals:', houseError);
      }
    } catch (error) {
      console.error('Error in recalculateSchoolAndHouseTotals:', error);
    }
  }

  async getTotalMinutes(): Promise<number> {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select('total_minutes');

    if (error) throw new Error(error.message);
    return data?.reduce((sum, u) => sum + (u.total_minutes || 0), 0) || 0;
  }

  async getActivityTypeCounts(): Promise<{ activity_type: string; count: number }[]> {
    const { data, error } = await this.supabaseClient
      .rpc('get_activity_type_counts');

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getActivitiesByEventId(eventId: string, userId: string): Promise<ActivityInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        user:users(*)
      `)
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities by event ID:', error);
      return [];
    }

    return data || [];
  }

  async getActivityMinutesByEvent(userId: string): Promise<Record<string, number>> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('event_id, duration_minutes')
      .eq('user_id', userId)
      .not('event_id', 'is', null);

    if (error) return {};

    return (data || []).reduce<Record<string, number>>((acc, row) => {
      if (!row.event_id) return acc;
      acc[row.event_id] = (acc[row.event_id] || 0) + (row.duration_minutes || 0);
      return acc;
    }, {});
  }

  async getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<ActivityInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        user:users(
          id,
          username,
          first_name,
          last_name,
          year_group,
          current_streak,
          total_points,
          total_minutes,
          school:schools(id, name, code),
          house:houses(id, name, color)
        ),
        event:events(id, name, points_multiplier)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getTotalCount(): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(error.message);
    return count || 0;
  }
}