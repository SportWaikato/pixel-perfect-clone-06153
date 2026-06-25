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
  is_active: boolean;
  participant_count: number;
  created_by?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  target_schools?: string[] | null; // UUID array, null means visible to all schools
  badge_achievement_id?: string;
  points_multiplier?: number;
  challenge_points?: number | null;
  youtube_video_url?: string | null;
  event_image_url?: string | null;
  event_image_storage_path?: string | null;
  is_student_suggested?: boolean;
  icon_type?: string | null;
  is_published: boolean;
  last_interaction_at?: string | null;
  is_assembly?: boolean;

  // Relationships
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
