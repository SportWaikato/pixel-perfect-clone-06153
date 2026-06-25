export interface AchievementInterface {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  image_filename?: string; // Badge image file name in public/badges/ (legacy)
  storage_url?: string; // Full public URL to badge image in Supabase storage
  storage_path?: string; // Storage path for badge image in Supabase storage  
  is_custom_upload?: boolean; // True if badge was uploaded via admin interface
  criteria: any; // JSON object with achievement criteria
  points_reward: number;
  is_active: boolean;
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