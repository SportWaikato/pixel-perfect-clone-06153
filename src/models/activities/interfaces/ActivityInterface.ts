import { UserInterface } from '@/models/users/interfaces/UserInterface';

export interface ActivityInterface {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  event_id?: string;
  activity_type: string;
  duration_minutes?: number;
  distance_km: number;
  feeling: 'very_sad' | 'sad' | 'average' | 'happy' | 'very_happy';
  participation_type: 'solo' | 'with_others';
  input_type: 'distance' | 'time';
  description?: string;
  custom_activity_name?: string | null;
  is_verified: boolean;
  is_rejected: boolean;
  is_flagged?: boolean;
  house_points_awarded: number;
  challenge_points_multiplier?: number;
  base_points?: number;
  final_points?: number;
  
  // Relationships
  user?: UserInterface;
  event?: {
    id: string;
    name: string;
    points_multiplier: number;
  };
}

export const ACTIVITY_TYPES = {
  bike_cycle: 'Bike / Cycle',
  team_sport: 'Team Sport',
  training_practice: 'Training / Practice',
  game_day_competition: 'Game Day / Competition',
  solo_sport: 'Solo Sport',
  workout_gym: 'Gym / Workout',
  scooter_skate: 'Scooter / Skate',
  walk_hike: 'Walk / Hike',
  kapa_haka: 'Kapa Haka',
  hunting_diving: 'Hunting / Diving',
  run_jog: 'Run / Jog',
  swimming: 'Swimming',
  active_games: 'Active Games',
  dance: 'Dance',
  watersports: 'Watersports',
  snowsports: 'Snow Sports',
  gamefit_vr: 'GameFit / VR',
  yoga: 'Yoga',
  something_else: 'Something else?'
} as const;

export const INPUT_TYPES = {
  manual: 'Manual Entry',
  device_sync: 'Device Sync',
  api_import: 'API Import',
  bulk_upload: 'Bulk Upload'
} as const; 