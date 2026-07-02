export interface AchievementInterface {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  image_filename?: string;
  storage_url?: string;
  storage_path?: string;
  is_custom_upload?: boolean;
  criteria: Record<string, unknown>;
  points_reward: number;
  is_active: boolean;
  scope?: "student" | "house" | "school";
  created_at: string;
}

export interface UserAchievementInterface {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  created_at: string;
  achievement?: AchievementInterface;
}

export interface HouseAchievementInterface {
  id: string;
  achievement_id: string;
  house_id: string;
  school_id: string;
  term_id: string | null;
  earned_at: string;
  created_at: string;
  achievement_name: string;
  achievement_description: string;
  icon_name: string;
  image_filename?: string;
  storage_url?: string;
  criteria: Record<string, unknown>;
  points_reward: number;
  house_name: string;
  house_color: string;
}

export type HouseChallengeMetric =
  | "total_minutes"
  | "average_minutes_per_student"
  | "participation_rate"
  | "average_streak"
  | "challenge_completions"
  | "challenge_completion_rate"
  | "unique_active_students"
  | "weekly_growth";

export interface HouseChallengeResult {
  house_id: string;
  house_name: string;
  house_color: string;
  score: number;
  rank: number;
  is_winner: boolean;
  awarded_points: number;
}

export interface HouseChallengeAwardConfig {
  winner_rule: "highest_total" | "highest_average" | "highest_percentage";
  award_top_n: number;
  active_definition?: {
    min_total_minutes: number;
  };
  min_minutes_per_streak_day?: number;
}
