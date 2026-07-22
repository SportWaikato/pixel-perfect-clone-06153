import { ACTIVITY_TYPES } from "@/models/activities/interfaces/ActivityInterface";
import { MAX_ACTIVITY_DURATION_MINUTES } from "@/models/activities/constants/activityValidationConstants";

// Activity keys the scanner may return. survey_completion is system-awarded,
// never something a workout screenshot can represent.
export const SCANNABLE_ACTIVITY_TYPES = Object.keys(ACTIVITY_TYPES).filter(
  (key) => key !== "survey_completion",
);

// Common labels fitness apps use that don't match our canonical keys 1:1.
// Keeps the scanner robust when the model answers with a near-miss.
const ACTIVITY_SYNONYMS: Record<string, string> = {
  swim: "swimming",
  swim_laps: "swimming",
  pool_swim: "swimming",
  open_water_swim: "swimming",
  gym_workout: "workout_gym",
  gym: "workout_gym",
  strength_training: "workout_gym",
  weight_training: "workout_gym",
  functional_training: "workout_gym",
  crossfit: "workout_gym",
  hiit: "workout_gym",
  pilates: "yoga",
  stretching: "yoga",
  sport_game: "team_sport",
  team_practice: "training_practice",
  practice: "training_practice",
  run: "run_jog",
  jog: "run_jog",
  running: "run_jog",
  treadmill: "run_jog",
  cycle: "bike_cycle",
  cycling: "bike_cycle",
  bike: "bike_cycle",
  indoor_cycling: "bike_cycle",
  spin: "bike_cycle",
  walk: "walk_hike",
  walking: "walk_hike",
  hike: "walk_hike",
  hiking: "walk_hike",
  ski_snowboard: "snowsports",
  ski: "snowsports",
  skiing: "snowsports",
  surf: "watersports",
  surfing: "watersports",
  paddle: "watersports",
  rowing: "watersports",
  row: "watersports",
  kayak: "kayaking",
  climb: "rock_climbing",
  climbing: "rock_climbing",
  boxing: "workout_gym",
  jump_rope: "active_games",
  dancing: "dance",
  snowboard: "snowboarding",
};

export interface WorkoutScanResult {
  activity_type: string | null;
  duration_minutes: number | null;
}

// Validates and normalises whatever the vision model returned so that only
// canonical ACTIVITY_TYPES keys and sane durations ever reach the client.
export const normalizeWorkoutScan = (raw: unknown): WorkoutScanResult => {
  const result: WorkoutScanResult = { activity_type: null, duration_minutes: null };
  if (!raw || typeof raw !== "object") return result;

  const candidate = raw as { activity_type?: unknown; duration_minutes?: unknown };

  if (typeof candidate.activity_type === "string") {
    const key = candidate.activity_type
      .trim()
      .toLowerCase()
      .replace(/[\s/-]+/g, "_");
    const mapped = SCANNABLE_ACTIVITY_TYPES.includes(key) ? key : ACTIVITY_SYNONYMS[key];
    if (mapped && SCANNABLE_ACTIVITY_TYPES.includes(mapped)) {
      result.activity_type = mapped;
    }
  }

  const duration = Number(candidate.duration_minutes);
  if (Number.isFinite(duration) && duration > 0) {
    result.duration_minutes = Math.min(Math.round(duration), MAX_ACTIVITY_DURATION_MINUTES);
  }

  return result;
};
