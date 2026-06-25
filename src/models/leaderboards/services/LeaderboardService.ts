import { SupabaseClient } from '@supabase/supabase-js';
import { 
  UserRankingInterface,
  SchoolLeaderboardEntry,
  HouseLeaderboardEntry,
  IndividualLeaderboardEntry,
  UserRankingSummary,
  RankingTrend,
  LeaderboardFilters
} from '../interfaces/LeaderboardInterface';
import { UserInterface } from '@/models/users/interfaces/UserInterface';

export class LeaderboardService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getUserRankings(userId: string): Promise<UserRankingSummary | null> {
    const [userResult, rankResult] = await Promise.all([
      this.supabaseClient
        .from('users')
        .select('id, created_at, updated_at, username, first_name, last_name, profile_icon_url, school_id, house_id, year_group, is_public, role, is_active, is_admin, total_points, total_kilometers, total_minutes, monthly_goal_minutes, current_streak, longest_streak, last_activity_date, school_rank, house_rank, year_group_rank, overall_rank, school:schools(id, name, is_internal), house:houses(id, name, color)')
        .eq('id', userId)
        .single(),
      this.supabaseClient
        .rpc('get_user_rankings', { p_user_id: userId })
        .single(),
    ]);

    if (userResult.error || !userResult.data) return null;

    const user = userResult.data as unknown as UserInterface;

    if (rankResult.error || !rankResult.data) {
      // Fall back to cached rank columns on the user record
      return {
        user,
        school_rank: user.school_rank ?? null,
        school_total_users: 0,
        house_rank: user.house_rank ?? null,
        house_total_users: 0,
        year_group_rank: user.year_group_rank ?? null,
        year_group_total_users: 0,
        overall_rank: user.overall_rank ?? null,
        overall_total_users: 0,
      };
    }

    const r = rankResult.data as {
      school_rank: number | null;
      school_total_users: number;
      house_rank: number | null;
      house_total_users: number;
      year_group_rank: number | null;
      year_group_total_users: number;
      overall_rank: number | null;
      overall_total_users: number;
    };
    return {
      user,
      school_rank: r.school_rank != null ? Number(r.school_rank) : null,
      school_total_users: Number(r.school_total_users),
      house_rank: r.house_rank != null ? Number(r.house_rank) : null,
      house_total_users: Number(r.house_total_users),
      year_group_rank: r.year_group_rank != null ? Number(r.year_group_rank) : null,
      year_group_total_users: Number(r.year_group_total_users),
      overall_rank: r.overall_rank != null ? Number(r.overall_rank) : null,
      overall_total_users: Number(r.overall_total_users),
    };
  }

  async getSchoolLeaderboard(userSchoolId?: string): Promise<SchoolLeaderboardEntry[]> {
    // First, check if the user's school is internal
    let isUserFromInternalSchool = false;
    if (userSchoolId) {
      const { data: userSchool } = await this.supabaseClient
        .from('schools')
        .select('is_internal')
        .eq('id', userSchoolId)
        .single();

      isUserFromInternalSchool = userSchool?.is_internal || false;
    }

    let query = this.supabaseClient
      .from('schools')
      .select('*')
      .eq('is_active', true);

    // CRITICAL LOGIC:
    // If user is from internal school, ONLY show their own school
    if (isUserFromInternalSchool && userSchoolId) {
      query = query.eq('id', userSchoolId);
    } else if (!isUserFromInternalSchool) {
      // Regular schools see only non-internal schools
      query = query.eq('is_internal', false);
    }

    const { data: schools, error } = await query
      .order('total_points', { ascending: false });

    if (error || !schools) return [];

    const leaderboard: SchoolLeaderboardEntry[] = schools.map((school, index) => {
      const proRataScore = school.total_students > 0 
        ? (school.total_points / school.total_students) * 100
        : 0;
      
      const averagePointsPerStudent = school.total_students > 0
        ? school.total_points / school.total_students
        : 0;
      
      // Keep km calculations commented for now (focusing on points)
      // const averageKmPerStudent = school.total_students > 0
      //   ? school.total_kilometers / school.total_students
      //   : 0;

      return {
        ...school,
        pro_rata_score: proRataScore,
        rank: index + 1,
        average_points_per_student: averagePointsPerStudent
        // average_km_per_student: averageKmPerStudent // Commented out - focusing on points
      };
    });

    // Sort by pro-rata score for fair comparison
    leaderboard.sort((a, b) => b.pro_rata_score - a.pro_rata_score);
    
    // Update ranks after sorting
    leaderboard.forEach((school, index) => {
      school.rank = index + 1;
    });

    return leaderboard;
  }

  async getHouseLeaderboard(schoolId: string): Promise<HouseLeaderboardEntry[]> {
    const { data: houses, error } = await this.supabaseClient
      .from('houses')
      .select(`
        *,
        members:users(count)
      `)
      .eq('school_id', schoolId)
      .order('total_points', { ascending: false });

    if (error || !houses) return [];

    const leaderboard: HouseLeaderboardEntry[] = houses.map((house, index) => {
      const memberCount = house.members?.[0]?.count || 0;
      const averagePointsPerMember = memberCount > 0 
        ? house.total_points / memberCount 
        : 0;
      
      // Keep km calculations commented for now (focusing on points)
      // const averageKmPerMember = memberCount > 0 
      //   ? house.total_kilometers / memberCount 
      //   : 0;

      return {
        ...house,
        rank: index + 1,
        average_points_per_member: averagePointsPerMember,
        member_count: memberCount
        // average_km_per_member: averageKmPerMember, // Commented out - focusing on points
      };
    });

    return leaderboard;
  }

  async getOverallLeaderboard(filters?: LeaderboardFilters): Promise<IndividualLeaderboardEntry[]> {
    let query = this.supabaseClient
      .from('users')
      .select('id, created_at, updated_at, username, first_name, last_name, profile_icon_url, is_public, school_id, house_id, year_group, role, is_active, is_admin, total_points, total_kilometers, total_minutes, monthly_goal_minutes, current_streak, longest_streak, last_activity_date, school_rank, house_rank, year_group_rank, overall_rank, school:schools(id, name), house:houses(id, name, color)')
      .order('total_points', { ascending: false });

    if (filters?.school_id) {
      query = query.eq('school_id', filters.school_id);
    }

    if (filters?.house_id) {
      query = query.eq('house_id', filters.house_id);
    }

    if (filters?.year_group) {
      query = query.eq('year_group', filters.year_group);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data: users, error } = await query;

    if (error || !users) return [];

    return users.map((user, index) => ({
      user: this.anonymizeUserIfPrivate(user as unknown as UserInterface),
      rank: (filters?.offset || 0) + index + 1,
      total_points: user.total_points || 0,
      total_kilometers: user.total_kilometers
    }));
  }

  private anonymizeUserIfPrivate(user: UserInterface): UserInterface {
    if (user.is_public) {
      return user;
    }

    // Return anonymized version of private users
    return {
      ...user,
      username: 'Anonymous',
      first_name: 'Anonymous',
      last_name: 'User',
      social_handle: undefined,
      profile_icon_url: undefined,
    };
  }

  async calculateProRataScore(schoolId: string): Promise<number> {
    const { data: school, error } = await this.supabaseClient
      .from('schools')
      .select('total_points, total_students')
      .eq('id', schoolId)
      .single();

    if (error || !school) return 0;

    return school.total_students > 0
      ? (school.total_points / school.total_students) * 100
      : 0;
  }

  async getAdminSchoolLeaderboard(): Promise<SchoolLeaderboardEntry[]> {
    // Admin version that always shows all schools including internal ones
    const { data: schools, error } = await this.supabaseClient
      .from('schools')
      .select('*')
      .eq('is_active', true)
      .order('total_points', { ascending: false });

    if (error || !schools) return [];

    const leaderboard: SchoolLeaderboardEntry[] = schools.map((school, index) => {
      const proRataScore = school.total_students > 0 
        ? (school.total_points / school.total_students) * 100
        : 0;
      
      const averagePointsPerStudent = school.total_students > 0
        ? school.total_points / school.total_students
        : 0;

      return {
        ...school,
        pro_rata_score: proRataScore,
        rank: index + 1,
        average_points_per_student: averagePointsPerStudent
      };
    });

    // Sort by pro-rata score for fair comparison
    leaderboard.sort((a, b) => b.pro_rata_score - a.pro_rata_score);
    
    // Update ranks after sorting
    leaderboard.forEach((school, index) => {
      school.rank = index + 1;
    });

    return leaderboard;
  }

  async getRankingTrend(userId: string, timeframe: 'week' | 'month' = 'week'): Promise<RankingTrend | null> {
    // This would need historical ranking data - for now return basic structure
    const currentRankings = await this.getUserRankings(userId);
    
    if (!currentRankings) return null;

    return {
      current_rank: currentRankings.overall_rank || 0,
      previous_rank: null, // Would need historical data
      change: 0,
      trend: 'same'
    };
  }

}