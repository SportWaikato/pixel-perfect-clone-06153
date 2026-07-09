// Maps platform workout identifiers → app activity-type keys.
//
// Apple HealthKit exposes HKWorkoutActivityType; Android Health Connect exposes
// ExerciseType. Capacitor health plugins normalise both to string names, but
// the exact casing/spelling varies by plugin, so we normalise aggressively
// (lowercase, strip non-alphanumerics) and match against a broad alias table.
// Anything unmatched maps to null — the sync flow then leaves the activity type
// for the student to pick, exactly like an unreadable screenshot scan does.

import type { ActivityTypeKey } from "./types";

// Normalised alias → app activity key. Keys are already run through `normalise`,
// so add new aliases in that same form (lowercase, alphanumeric only).
const ALIAS_TO_ACTIVITY: Record<string, ActivityTypeKey> = {
  // Run / jog
  running: "run_jog",
  run: "run_jog",
  jogging: "run_jog",
  trailrunning: "run_jog",
  treadmillrunning: "run_jog",
  // Walk / hike
  walking: "walk_hike",
  walk: "walk_hike",
  steps: "walk_hike",
  wheelchairwalkpace: "walk_hike",
  // Hiking is its own app type
  hiking: "tramping",
  hike: "tramping",
  // Bike / cycle
  cycling: "bike_cycle",
  biking: "bike_cycle",
  bike: "bike_cycle",
  indoorcycling: "bike_cycle",
  handcycling: "bike_cycle",
  mountainbiking: "bike_cycle",
  // BMX (rare on watches, but distinct in-app)
  bmx: "bmx",
  // Swimming
  swimming: "swimming",
  swimmingpool: "swimming",
  swimmingopenwater: "swimming",
  poolswim: "swimming",
  openwaterswim: "swimming",
  // Gym / strength
  traditionalstrengthtraining: "workout_gym",
  functionalstrengthtraining: "workout_gym",
  strengthtraining: "workout_gym",
  weightlifting: "workout_gym",
  hiit: "workout_gym",
  highintensityintervaltraining: "workout_gym",
  crosstraining: "workout_gym",
  coretraining: "workout_gym",
  gymnastics: "workout_gym",
  elliptical: "workout_gym",
  stairclimbing: "workout_gym",
  // Yoga / pilates
  yoga: "yoga",
  pilates: "yoga",
  mindandbody: "yoga",
  // Ballet / barre
  barre: "ballet",
  ballet: "ballet",
  // Dance
  dance: "dance",
  dancing: "dance",
  cardiodance: "dance",
  socialdance: "dance",
  // Skating
  skatingsports: "skating",
  skating: "skating",
  iceskating: "skating",
  inlineskating: "skating",
  rollerskating: "skating",
  rollerblading: "skating",
  // Scootering
  scootering: "scootering",
  scooter: "scootering",
  // Watersports
  paddlesports: "watersports",
  surfingsports: "watersports",
  surfing: "watersports",
  paddleboarding: "watersports",
  sailing: "watersports",
  waterfitness: "watersports",
  watersports: "watersports",
  // Kayaking / rowing / waka ama
  kayaking: "kayaking",
  rowing: "kayaking",
  paddling: "kayaking",
  wakaama: "kayaking",
  // Snow sports (ski)
  downhillskiing: "snowsports",
  crosscountryskiing: "snowsports",
  skiing: "snowsports",
  snowsports: "snowsports",
  // Snowboarding
  snowboarding: "snowboarding",
  // Rock climbing
  climbing: "rock_climbing",
  rockclimbing: "rock_climbing",
  bouldering: "rock_climbing",
  // Martial arts / taekwondo
  martialarts: "tae_kwon_do",
  taekwondo: "tae_kwon_do",
  kickboxing: "tae_kwon_do",
  boxing: "tae_kwon_do",
  taichi: "tae_kwon_do",
  wrestling: "tae_kwon_do",
  // Cricket
  cricket: "cricket",
  // Pickleball
  pickleball: "pickleball",
  // Hunting / diving
  hunting: "hunting_diving",
  fishing: "hunting_diving",
  underwaterdiving: "hunting_diving",
  scubadiving: "hunting_diving",
  // Team sports
  soccer: "team_sport",
  football: "team_sport",
  americanfootball: "team_sport",
  australianfootball: "team_sport",
  rugby: "team_sport",
  basketball: "team_sport",
  netball: "team_sport",
  hockey: "team_sport",
  fieldhockey: "team_sport",
  handball: "team_sport",
  volleyball: "team_sport",
  waterpolo: "team_sport",
  lacrosse: "team_sport",
  softball: "team_sport",
  baseball: "team_sport",
  // Solo sports
  tennis: "solo_sport",
  golf: "solo_sport",
  badminton: "solo_sport",
  squash: "solo_sport",
  tabletennis: "solo_sport",
  racquetball: "solo_sport",
  trackandfield: "solo_sport",
  archery: "solo_sport",
  bowling: "solo_sport",
  fencing: "solo_sport",
  // Active games / play
  play: "active_games",
  jumprope: "active_games",
  cardio: "active_games",
  mixedcardio: "active_games",
};

/** Lowercase + strip everything but a–z0–9 so "Traditional Strength Training",
 *  "traditionalStrengthTraining" and "TRADITIONAL_STRENGTH_TRAINING" all match. */
export const normalise = (raw: string): string => raw.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Best-effort map from a platform activity identifier to an app activity key.
 * Returns null when there's no confident match (caller leaves it unset).
 */
export const mapPlatformActivityType = (sourceActivityType: string): ActivityTypeKey | null => {
  if (!sourceActivityType) return null;
  return ALIAS_TO_ACTIVITY[normalise(sourceActivityType)] ?? null;
};
