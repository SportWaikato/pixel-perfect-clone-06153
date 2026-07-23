import { UserInterface } from "@/models/users/interfaces/UserInterface";

export interface ActivityInterface {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  event_id?: string;
  activity_type: string;
  duration_minutes?: number;
  distance_km: number;
  feeling: "very_sad" | "sad" | "average" | "happy" | "very_happy";
  participation_type: "solo" | "with_others";
  input_type: "distance" | "time";
  description?: string;
  custom_activity_name?: string | null;
  activity_context?: "training" | "casual" | "competition" | null;
  competition_name?: string | null;
  is_verified: boolean;
  is_rejected: boolean;
  is_flagged?: boolean;
  house_points_awarded: number;
  challenge_points_multiplier?: number;
  base_points?: number;
  final_points?: number;
  proof_image_url?: string | null;
  proof_image_storage_path?: string | null;
  external_id?: string | null;

  // Relationships
  user?: UserInterface;
  event?: {
    id: string;
    name: string;
    points_multiplier: number;
  };
}

// Current activity types — these appear in the picker and the search autocomplete.
// "Something else?" is always last so users see specific sports first.
export const ACTIVITY_TYPES = {
  rugby: "Rugby",
  netball: "Netball",
  basketball: "Basketball",
  soccer: "Soccer",
  hockey: "Hockey",
  volleyball: "Volleyball",
  tennis: "Tennis",
  badminton: "Badminton",
  athletics: "Athletics",
  table_tennis: "Table Tennis",
  golf: "Golf",
  gymnastics: "Gymnastics",
  rowing: "Rowing",
  karate: "Karate",
  boxing: "Boxing",
  fencing: "Fencing",
  archery: "Archery",
  softball: "Softball",
  horse_riding: "Horse Riding",
  water_polo: "Water Polo",
  ice_skating: "Ice Skating",
  walk_hike: "Walking",
  run_jog: "Run",
  bike_cycle: "Cycling",
  swimming: "Swimming",
  surfing: "Surfing",
  skateboarding: "Skateboarding",
  kayaking: "Kayaking",
  rock_climbing: "Rock Climbing",
  workout_gym: "Gym / Workout",
  yoga: "Yoga",
  dance: "Dance",
  kapa_haka: "Kapa Haka",
  hunting: "Hunting",
  skiing: "Skiing",
  snowboarding: "Snowboarding",
  gamefit_vr: "VR",
  bmx: "BMX",
  cricket: "Cricket",
  pickleball: "Pickleball",
  scootering: "Scootering",
  tramping: "Tramping",
  ballet: "Ballet",
  active_games: "Active Games",
  touch_rugby: "Touch Rugby",
  waka_ama: "Waka Ama",
  rugby_league: "Rugby League",
  squash: "Squash",
  disc_golf: "Disc Golf",
  surf_lifesaving: "Surf Life-Saving",
  futsal: "Futsal",
  lawn_bowls: "Lawn Bowls",
  triathlon: "Triathlon",
  trail_running: "Trail Running",
  tae_kwon_do: "Tae Kwon Do",
  something_else: "Something else?",
  survey_completion: "Survey Completed",
} as const;

// Legacy types kept only so historical records resolve to a friendly label + icon.
// NOT shown in pickers or autocomplete.
export const LEGACY_ACTIVITY_TYPES = {
  scooter_skate: "Scooter / Skate",
  team_sport: "Team Sport",
  training_practice: "Training / Practice",
  game_day_competition: "Game Day / Competition",
  solo_sport: "Solo Sport",
  skating: "Skating",
  hunting_diving: "Hunting / Diving",
  watersports: "Watersports",
  snowsports: "Snow Sports",
  football: "Football",
} as const;

// Label lookup across current + legacy types (use for DISPLAY only, not for pickers).
export const ALL_ACTIVITY_TYPE_LABELS: Record<string, string> = {
  ...ACTIVITY_TYPES,
  ...LEGACY_ACTIVITY_TYPES,
};

// Selectable types for pickers — current types only, legacy excluded.
export const SELECTABLE_ACTIVITY_TYPES = ACTIVITY_TYPES;

export const INPUT_TYPES = {
  manual: "Manual Entry",
  device_sync: "Device Sync",
  api_import: "API Import",
  bulk_upload: "Bulk Upload",
} as const;
