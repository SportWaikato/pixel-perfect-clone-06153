import { SupabaseClient } from "@supabase/supabase-js";
import { UserInterface } from "../interfaces/UserInterface";
import { LeaderboardService } from "@/models/leaderboards/services/LeaderboardService";

const TABLE_NAME = "users";

export class UserService {
  private supabaseClient: SupabaseClient;
  private leaderboardService: LeaderboardService;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
    this.leaderboardService = new LeaderboardService(supabaseClient);
  }

  async getCurrentUser(): Promise<UserInterface | null> {
    const {
      data: { user },
      error,
    } = await this.supabaseClient.auth.getUser();
    if (!user || error) return null;

    const { data, error: userError } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        school:schools(*),
        house:houses(*)
      `,
      )
      .eq("id", user.id)
      .single();

    if (userError || !data) return null;

    return {
      ...data,
      email: user.email,
      role: data.role || "student", // Ensure role is always set
    };
  }

  async getById(id: string): Promise<UserInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        school:schools(*),
        house:houses(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      ...data,
      role: data.role || "student", // Ensure role is always set
    };
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const { count } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("id", { count: "exact", head: true })
      .eq("username", username);
    return (count ?? 0) > 0;
  }

  async create(userData: Partial<UserInterface>): Promise<UserInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert(userData)
      .select(
        `
        *,
        school:schools(*),
        house:houses(*)
      `,
      )
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, userData: Partial<UserInterface>): Promise<UserInterface | null> {
    const { role: _role, ...safeData } = userData;
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        ...safeData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        school:schools(*),
        house:houses(*)
      `,
      )
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateUserRole(id: string, role: UserInterface["role"]): Promise<UserInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        school:schools(*),
        house:houses(*)
      `,
      )
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateUserRankings(userId: string): Promise<UserInterface | null> {
    try {
      const userRankings = await this.leaderboardService.getUserRankings(userId);

      if (!userRankings) return null;

      const { data, error } = await this.supabaseClient
        .from(TABLE_NAME)
        .update({
          school_rank: userRankings.school_rank,
          house_rank: userRankings.house_rank,
          year_group_rank: userRankings.year_group_rank,
          overall_rank: userRankings.overall_rank,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select(
          `
          *,
          school:schools(*),
          house:houses(*)
        `,
        )
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      console.error("Error updating user rankings:", error);
      return null;
    }
  }

  async updateUserTotalKilometers(
    userId: string,
    totalKilometers: number,
  ): Promise<UserInterface | null> {
    const updatedUser = await this.update(userId, { total_kilometers: totalKilometers });

    // Update rankings after kilometers change
    await this.updateUserRankings(userId);

    return updatedUser;
  }

  async getUsersWithRankings(filters?: {
    school_id?: string;
    house_id?: string;
    year_group?: string;
    limit?: number;
  }): Promise<UserInterface[]> {
    let query = this.supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        school:schools(*),
        house:houses(*)
      `,
      )
      .eq("is_deleted", false)
      .order("total_kilometers", { ascending: false });

    if (filters?.school_id) {
      query = query.eq("school_id", filters.school_id);
    }

    if (filters?.house_id) {
      query = query.eq("house_id", filters.house_id);
    }

    if (filters?.year_group) {
      query = query.eq("year_group", filters.year_group);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Apply privacy anonymization
    return (data || []).map((user) => this.anonymizeUserIfPrivate(user));
  }

  private anonymizeUserIfPrivate(user: UserInterface): UserInterface {
    if (user.is_public) {
      return user;
    }

    // Return anonymized version of private users
    return {
      ...user,
      username: "Anonymous",
      first_name: "Anonymous",
      last_name: "User",
      social_handle: undefined,
      profile_icon_url: undefined,
    };
  }

  async recalculateAllRankings(): Promise<void> {
    const { error } = await this.supabaseClient.rpc("recalculate_all_rankings");
    if (error) throw new Error(error.message);
  }

  async recalculateUserStreak(userId: string): Promise<UserInterface | null> {
    try {
      // Call the database function to calculate streaks
      const { data: streakData, error: streakError } = await this.supabaseClient
        .rpc("calculate_user_streak", { user_id_param: userId })
        .single();

      if (streakError) {
        console.error("Error calculating streak:", streakError);
        return null;
      }

      // Type assertion for the RPC response
      const typedStreakData = streakData as {
        current_streak_days: number;
        longest_streak_days: number;
        last_activity_date_calc: string | null;
      };

      // Update the user with calculated streak data
      const { data: updatedUser, error: updateError } = await this.supabaseClient
        .from(TABLE_NAME)
        .update({
          current_streak: typedStreakData.current_streak_days,
          longest_streak: typedStreakData.longest_streak_days,
          last_activity_date: typedStreakData.last_activity_date_calc,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select(
          `
          *,
          school:schools(*),
          house:houses(*)
        `,
        )
        .single();

      if (updateError) {
        console.error("Error updating user streak:", updateError);
        return null;
      }

      return updatedUser;
    } catch (error) {
      console.error("Error recalculating user streak:", error);
      return null;
    }
  }

  async getCurrentMonthProgress(userId: string) {
    const { data, error } = await this.supabaseClient
      .rpc("get_user_current_month_progress", { p_user_id: userId })
      .single();

    if (error) {
      console.error("Error fetching current month progress:", error);
      return {
        current_month_minutes: 0,
        current_month_points: 0,
        current_month_activities: 0,
        month_start: new Date().toISOString(),
        days_in_month: 30,
        days_remaining: 30,
      };
    }

    return data;
  }

  async getMonthlyHistory(userId: string, monthsBack: number = 6) {
    const { data, error } = await this.supabaseClient.rpc("get_user_monthly_history", {
      p_user_id: userId,
      p_months_back: monthsBack,
    });

    if (error) {
      console.error("Error fetching monthly history:", error);
      return [];
    }

    return data;
  }

  async recalculateAllUserStreaks(): Promise<void> {
    try {
      // Call the database function to recalculate all user streaks
      const { error } = await this.supabaseClient.rpc("recalculate_all_user_streaks");

      if (error) {
        console.error("Error recalculating all user streaks:", error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Error in recalculateAllUserStreaks:", error);
      throw error;
    }
  }

  async getUserPointsBreakdown(userId: string): Promise<{
    totalBasePoints: number;
    totalFinalPoints: number;
    totalBonusPoints: number;
    challengeActivitiesCount: number;
    totalActivitiesCount: number;
  }> {
    try {
      // Get all user activities with points data.
      // Limit is a safeguard — at realistic activity rates (2/day) this covers ~7 years.
      // Long-term: replace with a DB-level aggregate query to avoid fetching rows at all.
      const { data: activities, error } = await this.supabaseClient
        .from("activities")
        .select(
          `
          base_points,
          final_points,
          challenge_points_multiplier,
          event_id
        `,
        )
        .eq("user_id", userId)
        .limit(5000);

      if (error) {
        console.error("Error fetching user points breakdown:", error);
        return {
          totalBasePoints: 0,
          totalFinalPoints: 0,
          totalBonusPoints: 0,
          challengeActivitiesCount: 0,
          totalActivitiesCount: 0,
        };
      }

      const totalBasePoints =
        activities?.reduce((sum, activity) => sum + (activity.base_points || 0), 0) || 0;
      const totalFinalPoints =
        activities?.reduce((sum, activity) => sum + (activity.final_points || 0), 0) || 0;
      const totalBonusPoints = totalFinalPoints - totalBasePoints;
      const challengeActivitiesCount =
        activities?.filter((activity) => activity.event_id != null).length || 0;

      return {
        totalBasePoints,
        totalFinalPoints,
        totalBonusPoints,
        challengeActivitiesCount,
        totalActivitiesCount: activities?.length || 0,
      };
    } catch (error) {
      console.error("Error in getUserPointsBreakdown:", error);
      return {
        totalBasePoints: 0,
        totalFinalPoints: 0,
        totalBonusPoints: 0,
        challengeActivitiesCount: 0,
        totalActivitiesCount: 0,
      };
    }
  }

  async getUserRoleById(userId: string): Promise<string | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data.role;
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async hardDeleteUser(id: string): Promise<void> {
    const { error } = await this.supabaseClient.rpc("hard_delete_user", {
      p_user_id: id,
    });
    if (error) throw new Error(error.message);
  }

  async restoreUser(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({ is_deleted: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getDeletedUsers(schoolId?: string): Promise<UserInterface[]> {
    let query = this.supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        school:schools(*),
        house:houses(*)
      `,
      )
      .eq("is_deleted", true)
      .order("updated_at", { ascending: false });

    if (schoolId) {
      query = query.eq("school_id", schoolId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getSchoolUserStats(
    schoolId: string,
  ): Promise<{ total: number; active: number; totalMinutes: number }> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("id, is_active, is_deleted, total_minutes")
      .eq("school_id", schoolId)
      .eq("is_deleted", false);

    if (error || !data) return { total: 0, active: 0, totalMinutes: 0 };

    return {
      total: data.length,
      active: data.filter((u) => u.is_active !== false).length,
      totalMinutes: data.reduce((sum, u) => sum + (u.total_minutes || 0), 0),
    };
  }

  async getTotalCount(): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async getNewSignupsCount(since: Date): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*", { count: "exact", head: true })
      .gte("created_at", since.toISOString());

    if (error) throw new Error(error.message);
    return count || 0;
  }
}
