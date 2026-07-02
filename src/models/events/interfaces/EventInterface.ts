export interface EventInterface {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date: string;
  target_minutes?: number | null;
  target_distance?: number | null;
  target_sessions?: number | null;
  target_days?: number | null;
  required_tag?: string | null;
  completion_type?:
    | "minutes_total"
    | "minutes_daily"
    | "session_count"
    | "active_days"
    | "tagged_minutes"
    | "unique_activity_types"
    | "collective_minutes_total"
    | "collective_minutes_daily"
    | "participation_rate"
    | null;
  scope?: "individual" | "house" | "school" | null;
  is_active: boolean;
  participant_count: number;
  created_by?: string;
  suggested_by_user_id?: string | null;
  approved_by_user_id?: string | null;
  approved_at?: string | null;
  approval_status: "draft" | "pending" | "approved" | "rejected" | "published";
  target_schools?: string[] | null;
  badge_achievement_id?: string;
  points_multiplier?: number;
  challenge_points?: number | null;
  youtube_video_url?: string | null;
  event_image_url?: string | null;
  event_image_storage_path?: string | null;
  is_student_suggested?: boolean;
  suggestion_image_url?: string | null;
  rejection_reason?: string | null;
  icon_type?: string | null;
  is_published: boolean;
  last_interaction_at?: string | null;
  is_assembly?: boolean;

  creator?: {
    username: string;
    first_name: string;
    last_name: string;
  };
  badge?: {
    id: string;
    name: string;
    description: string;
    icon_name: string;
    image_filename: string;
    points_reward: number;
  };
}

export interface ChallengeProgress {
  challenge_id: string;
  user_id: string;
  house_id?: string;
  school_id: string;
  progress_value: number;
  target_value: number;
  completed: boolean;
  completed_at?: string;
}

export const COMPLETION_TYPE_LABELS: Record<string, string> = {
  minutes_total: "Log a total number of minutes",
  minutes_daily: "Log minutes each day",
  session_count: "Complete one session",
  active_days: "Be active on a number of days",
  tagged_minutes: "Complete minutes with a tag (e.g. with others)",
  unique_activity_types: "Try different activity types",
  collective_minutes_total: "House reaches a shared total",
  collective_minutes_daily: "House reaches daily shared target",
  participation_rate: "House gets highest participation rate",
};
