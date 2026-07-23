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
  // Proof images are private evidence — visible only to the owner and school
  // admins for verification. Never surfaced in any public/shared UI.
  proof_image_url?: string | null;
  proof_image_storage_path?: string | null;
  // Stable id from a health platform (Apple Health / Health Connect) so
  // wearable re-syncs never import the same workout twice.
  external_id?: string | null;

  // Relationships
  user?: UserInterface;
  event?: {
    id: string;
    name: string;
    points_multiplier: number;
  };
}

export const ACTIVITY_TYPES = {
  bike_cycle: "Bike / Cycle",
  team_sport: "Team Sport",
  training_practice: "Training / Practice",
  game_day_competition: "Game Day / Competition",
  solo_sport: "Solo Sport",
  workout_gym: "Gym / Workout",
  skating: "Skating",
  scootering: "Scootering",
  walk_hike: "Walk / Hike",
  kapa_haka: "Kapa Haka",
  hunting_diving: "Hunting / Diving",
  run_jog: "Run / Jog",
  swimming: "Swimming",
  active_games: "Active Games",
  dance: "Dance",
  watersports: "Watersports",
  snowsports: "Snow Sports",
  gamefit_vr: "GameFit / VR",
  yoga: "Yoga",
  ballet: "Ballet",
  bmx: "BMX",
  cricket: "Cricket",
  kayaking: "Kayaking",
  pickleball: "Pickleball",
  rock_climbing: "Rock Climbing",
  snowboarding: "Snowboarding",
  tae_kwon_do: "Tae Kwon Do",
  tramping: "Tramping",
  something_else: "Something else?",
  survey_completion: "Survey Completed",
} as const;

// Retired activity types kept only so historical records still resolve to a
// friendly label + icon. NOT shown in pickers (see SELECTABLE_ACTIVITY_TYPES).
// `scooter_skate` was split into `skating` + `scootering` on 2026-07-04; existing
// rows are intentionally left as-is pending a reviewed reclassification decision.
export const LEGACY_ACTIVITY_TYPES = {
  scooter_skate: "Scooter / Skate",
} as const;

// Label lookup across current + legacy types (use for DISPLAY, not for pickers).
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
