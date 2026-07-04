export const APPLICATION_NAME = "Karawhiua";
export const APPLICATION_DESCRIPTION = "Virtual sports day platform for schools - Go for it!";

export const isDevEnv = process.env.NODE_ENV === "development";

// Activity conversion rates (minutes to kilometers) - Based on PDF conversion rates
export const ACTIVITY_CONVERSION_RATES = {
  // Original PDF-sourced activity types
  walking: 0.0006, // 1 minute = 0.0006 km (from PDF: 0.06 miles/10min = 0.06*1.6/10 km/min)
  running: 0.01, // 1 minute = 0.01 km (moderate running)
  cycling: 0.016, // 1 minute = 0.016 km (moderate cycling)
  swimming: 0.008, // 1 minute = 0.008 km
  team_sports: 0.01, // 1 minute = 0.01 km
  gym_fitness: 0.006, // 1 minute = 0.006 km
  dance: 0.008, // 1 minute = 0.008 km
  other: 0.006, // Default rate

  // Extended activity types for NZ context (using similar rates to PDF originals)
  bike_cycle: 0.016, // Same as cycling
  team_sport: 0.01, // Same as team_sports
  solo_sport: 0.01, // Same as team_sports
  workout_gym: 0.006, // Same as gym_fitness
  skating: 0.012, // Between cycling and running
  scootering: 0.012, // Between cycling and running
  scooter_skate: 0.012, // Legacy — kept so historical records still convert
  walk_hike: 0.0006, // Same as walking
  kapa_haka: 0.008, // Same as dance
  hunting_diving: 0.008, // Similar to swimming
  run_jog: 0.01, // Same as running
  active_games: 0.008, // Similar to dance
  watersports: 0.008, // Similar to swimming
  snowsports: 0.012, // Between cycling and running
  gamefit_vr: 0.006, // Same as gym_fitness
  yoga: 0.008, // Same as dance
  something_else: 0.006, // Default rate
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
