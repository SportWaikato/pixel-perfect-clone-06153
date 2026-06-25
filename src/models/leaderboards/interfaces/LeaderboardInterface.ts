import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { HouseInterface } from '@/models/houses/interfaces/HouseInterface';

export interface UserRankingInterface {
  user_id: string;
  school_rank: number | null;
  house_rank: number | null;
  year_group_rank: number | null;
  overall_rank: number | null;
  total_kilometers: number;
}

export interface SchoolLeaderboardEntry extends SchoolInterface {
  pro_rata_score: number;
  rank: number;
  average_points_per_student: number;
  // average_km_per_student: number; // Commented out - focusing on points
}

export interface HouseLeaderboardEntry extends HouseInterface {
  rank: number;
  average_points_per_member: number;
  member_count: number;
  // average_km_per_member: number; // Commented out - focusing on points
}

export interface IndividualLeaderboardEntry {
  user: UserInterface;
  rank: number;
  total_points: number;
  total_kilometers: number;
}

export interface UserRankingSummary {
  user: UserInterface;
  school_rank: number | null;
  school_total_users: number;
  house_rank: number | null;
  house_total_users: number;
  year_group_rank: number | null;
  year_group_total_users: number;
  overall_rank: number | null;
  overall_total_users: number;
}

export interface RankingTrend {
  current_rank: number;
  previous_rank: number | null;
  change: number;
  trend: 'up' | 'down' | 'same' | 'new';
}

export interface LeaderboardFilters {
  school_id?: string;
  house_id?: string;
  year_group?: string;
  limit?: number;
  offset?: number;
}