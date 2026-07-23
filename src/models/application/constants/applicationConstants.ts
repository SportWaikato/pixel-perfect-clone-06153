export const APPLICATION_NAME = "Karawhiua";
export const APPLICATION_DESCRIPTION = "Virtual sports day platform for schools - Go for it!";

export const isDevEnv = process.env.NODE_ENV === "development";

// Activity conversion rates (minutes to kilometers) - Based on PDF conversion rates
export const ACTIVITY_CONVERSION_RATES = {
  // Original PDF-sourced activity types
  walking: 0.0006,
  running: 0.01,
  cycling: 0.016,
  swimming: 0.008,
  team_sports: 0.01,
  gym_fitness: 0.006,
  dance: 0.008,
  other: 0.006,

  bike_cycle: 0.016,
  run_jog: 0.01,
  walk_hike: 0.0006,
  surfing: 0.008,
  skiing: 0.012,
  snowboarding: 0.012,
  gamefit_vr: 0.006,
  yoga: 0.008,
  kapa_haka: 0.008,
  active_games: 0.008,
  something_else: 0.006,
  survey_completion: 0,

  rugby: 0.01,
  netball: 0.01,
  basketball: 0.01,
  soccer: 0.01,
  hockey: 0.01,
  volleyball: 0.008,
  tennis: 0.008,
  badminton: 0.008,
  athletics: 0.01,
  table_tennis: 0.006,
  golf: 0.008,
  gymnastics: 0.006,
  rowing: 0.008,
  karate: 0.008,
  boxing: 0.008,
  fencing: 0.008,
  archery: 0.006,
  softball: 0.01,
  cricket: 0.008,
  horse_riding: 0.006,
  water_polo: 0.008,
  ice_skating: 0.012,
  skateboarding: 0.012,
  scootering: 0.012,
  kayaking: 0.008,
  rock_climbing: 0.006,
  workout_gym: 0.006,
  hunting: 0.008,
  bmx: 0.016,
  pickleball: 0.008,
  tramping: 0.006,
  ballet: 0.008,
  touch_rugby: 0.01,
  waka_ama: 0.008,
  rugby_league: 0.01,
  squash: 0.008,
  disc_golf: 0.008,
  surf_lifesaving: 0.008,
  futsal: 0.01,
  lawn_bowls: 0.006,
  triathlon: 0.01,
  trail_running: 0.008,
  tae_kwon_do: 0.008,

  // Legacy — kept so historical records still convert
  team_sport: 0.01,
  solo_sport: 0.01,
  training_practice: 0.01,
  game_day_competition: 0.01,
  skating: 0.012,
  scooter_skate: 0.012,
  hunting_diving: 0.008,
  watersports: 0.008,
  snowsports: 0.012,
  football: 0.01,
} as const;

// Time-based constants
export const TIME_GOALS = {
  DAILY_MINUTES: 60, // 1 hour per day target
  WEEKLY_MINUTES: 420, // 7 hours per week
  MONTHLY_MINUTES: 1800, // 30 hours per month (default)
} as const;

// Helper function to calculate display distance from time
export const calculateDistanceFromTime = (
  activityType: keyof typeof ACTIVITY_CONVERSION_RATES,
  minutes: number,
): number => {
  const rate = ACTIVITY_CONVERSION_RATES[activityType] || ACTIVITY_CONVERSION_RATES.something_else;
  return Number((rate * minutes).toFixed(3));
};

// Helper function to format time display
export const formatTimeDisplay = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}min`;
  }
};

// Activity input types - preserved original plus time-only transition
export const ACTIVITY_INPUT_TYPES = {
  DISTANCE: "distance", // Original from PDF system
  TIME: "time", // Current system
} as const;

// Points system (preserved both for compatibility)
export const DEFAULT_POINTS_PER_KM = 1; // Original PDF-based system
export const DEFAULT_POINTS_PER_HOUR = 60; // Current time-based system - 1 point per minute

export const YEAR_GROUPS = [
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
  "Year 13",
  "Kaiako",
] as const;
export type YearGroup = (typeof YEAR_GROUPS)[number] | "NA" | "Staff";

export const YEAR_GROUP_NA = "NA";
export const YEAR_GROUP_STAFF = "Staff";
export const YEAR_GROUP_KAIAKO = "Kaiako";
