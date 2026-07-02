import { HouseInterface } from "@/models/houses/interfaces/HouseInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";

export interface UserInterface {
  id: string;
  created_at: string;
  updated_at: string;
  username: string;
  social_handle?: string;
  first_name: string;
  last_name: string;
  email?: string; // From Supabase auth
  profile_icon_url?: string;
  school_id: string;
  house_id?: string | null;
  year_group?: string;
  class?: string;
  is_admin: boolean;
  is_active: boolean; // For user suspension/activation
  is_deleted?: boolean; // Soft-delete; hides user from all regular lists
  is_public: boolean;
  role: "student" | "school_admin" | "super_admin";

  // Time-based fields (primary)
  total_minutes: number;
  monthly_goal_minutes: number;

  // Points field (primary for rankings)
  total_points: number;

  // Distance field (calculated for display)
  total_kilometers: number;

  // Streak tracking fields
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;

  // Ranking cache fields
  school_rank: number | null;
  house_rank: number | null;
  year_group_rank: number | null;
  overall_rank: number | null;

  // Relationships
  school?: SchoolInterface;
  house?: HouseInterface;
}
