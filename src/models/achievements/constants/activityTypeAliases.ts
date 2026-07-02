/**
 * Activity Type Aliases Mapping
 *
 * This mapping ensures backward compatibility between legacy activity type names
 * and the current naming convention. Each key can match any value in its array.
 *
 * Legacy types (from PDF system): cycling, walking, running, swimming, team_sports, gym_fitness, dance, vr_gaming
 * Current types (NZ system): bike_cycle, walk_hike, run_jog, team_sport, workout_gym, kapa_haka, gamefit_vr, etc.
 */
export const ACTIVITY_TYPE_ALIASES: Record<string, string[]> = {
  // Cycling variations
  cycling: ["bike_cycle", "cycling"],
  bike_cycle: ["cycling", "bike_cycle"],

  // Walking variations
  walking: ["walk_hike", "walking"],
  walk_hike: ["walking", "walk_hike"],

  // Running variations
  running: ["run_jog", "running"],
  run_jog: ["running", "run_jog"],

  // Team sports variations
  team_sports: ["team_sport", "team_sports"],
  team_sport: ["team_sports", "team_sport"],

  // Gym/fitness variations
  gym_fitness: ["workout_gym", "gym_fitness"],
  workout_gym: ["gym_fitness", "workout_gym"],

  // VR/Gaming variations
  vr_gaming: ["gamefit_vr", "vr_gaming"],
  gamefit_vr: ["vr_gaming", "gamefit_vr"],

  // Dance variations (for future compatibility)
  dance: ["kapa_haka", "dance"],
  kapa_haka: ["dance", "kapa_haka"],
};

/**
 * Check if two activity types match, considering aliases
 */
export function activityTypesMatch(type1: string, type2: string): boolean {
  // Direct match
  if (type1 === type2) return true;

  // Check if type1 is an alias of type2
  const aliases2 = ACTIVITY_TYPE_ALIASES[type2] || [];
  if (aliases2.includes(type1)) return true;

  // Check if type2 is an alias of type1
  const aliases1 = ACTIVITY_TYPE_ALIASES[type1] || [];
  if (aliases1.includes(type2)) return true;

  return false;
}

/**
 * Get all equivalent activity types for a given type
 */
export function getEquivalentActivityTypes(activityType: string): string[] {
  return ACTIVITY_TYPE_ALIASES[activityType] || [activityType];
}

/**
 * Filter activities by activity type, considering aliases
 */
export function filterActivitiesByType(activities: any[], targetType: string): any[] {
  return activities.filter((activity) => activityTypesMatch(activity.activity_type, targetType));
}
