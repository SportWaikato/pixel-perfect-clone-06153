// Maps platform workout identifiers → Karawhiua ACTIVITY_TYPES keys, for the
// native app. Two shapes to handle:
//   • Apple HealthKit → string names ("Running", "TraditionalStrengthTraining")
//   • Android Health Connect → NUMERIC exercise-type enums (56 = RUNNING, …)
//     (this is the bit the web-side src/modules/wearables/activityTypeMap.ts
//     does NOT cover, because the Capacitor path never existed here.)
//
// Anything unmatched returns null — the sync then logs the workout with the
// activity type left for the student to confirm, exactly like an unreadable
// screenshot scan. Keep the string aliases in sync with the web table when it
// changes; the two should eventually share one source of truth.

// App activity keys (mirror of ACTIVITY_TYPES in the web app).
export type AppActivityType =
  | 'run_jog'
  | 'walk_hike'
  | 'tramping'
  | 'bike_cycle'
  | 'bmx'
  | 'swimming'
  | 'workout_gym'
  | 'yoga'
  | 'ballet'
  | 'dance'
  | 'skating'
  | 'scootering'
  | 'watersports'
  | 'kayaking'
  | 'snowsports'
  | 'snowboarding'
  | 'rock_climbing'
  | 'tae_kwon_do'
  | 'cricket'
  | 'pickleball'
  | 'hunting_diving'
  | 'team_sport'
  | 'solo_sport'
  | 'active_games';

// Normalised string alias → app key. Add aliases already lowercased + stripped.
const ALIAS_TO_ACTIVITY: Record<string, AppActivityType> = {
  running: 'run_jog',
  run: 'run_jog',
  jogging: 'run_jog',
  trailrunning: 'run_jog',
  treadmillrunning: 'run_jog',
  walking: 'walk_hike',
  walk: 'walk_hike',
  steps: 'walk_hike',
  hiking: 'tramping',
  hike: 'tramping',
  cycling: 'bike_cycle',
  biking: 'bike_cycle',
  bike: 'bike_cycle',
  indoorcycling: 'bike_cycle',
  mountainbiking: 'bike_cycle',
  bmx: 'bmx',
  swimming: 'swimming',
  swimmingpool: 'swimming',
  swimmingopenwater: 'swimming',
  traditionalstrengthtraining: 'workout_gym',
  functionalstrengthtraining: 'workout_gym',
  strengthtraining: 'workout_gym',
  weightlifting: 'workout_gym',
  hiit: 'workout_gym',
  highintensityintervaltraining: 'workout_gym',
  boot camp: 'workout_gym',
  elliptical: 'workout_gym',
  stairclimbing: 'workout_gym',
  yoga: 'yoga',
  pilates: 'yoga',
  barre: 'ballet',
  ballet: 'ballet',
  dance: 'dance',
  dancing: 'dance',
  skating: 'skating',
  iceskating: 'skating',
  inlineskating: 'skating',
  rollerskating: 'skating',
  scootering: 'scootering',
  paddlesports: 'watersports',
  surfing: 'watersports',
  sailing: 'watersports',
  kayaking: 'kayaking',
  rowing: 'kayaking',
  wakaama: 'kayaking',
  skiing: 'snowsports',
  snowboarding: 'snowboarding',
  climbing: 'rock_climbing',
  rockclimbing: 'rock_climbing',
  bouldering: 'rock_climbing',
  martialarts: 'tae_kwon_do',
  taekwondo: 'tae_kwon_do',
  boxing: 'tae_kwon_do',
  cricket: 'cricket',
  pickleball: 'pickleball',
  hunting: 'hunting_diving',
  underwaterdiving: 'hunting_diving',
  soccer: 'team_sport',
  football: 'team_sport',
  rugby: 'team_sport',
  basketball: 'team_sport',
  netball: 'team_sport',
  hockey: 'team_sport',
  volleyball: 'team_sport',
  tennis: 'solo_sport',
  golf: 'solo_sport',
  badminton: 'solo_sport',
  squash: 'solo_sport',
  tabletennis: 'solo_sport',
  jumprope: 'active_games',
  cardio: 'active_games',
};

// Health Connect numeric ExerciseType enum → app key. Values from
// react-native-health-connect's ExerciseType constants.
const HC_CODE_TO_ACTIVITY: Record<number, AppActivityType> = {
  56: 'run_jog', // RUNNING
  57: 'run_jog', // RUNNING_TREADMILL
  79: 'walk_hike', // WALKING
  37: 'tramping', // HIKING
  8: 'bike_cycle', // BIKING
  9: 'bike_cycle', // BIKING_STATIONARY
  73: 'swimming', // SWIMMING_OPEN_WATER
  74: 'swimming', // SWIMMING_POOL
  70: 'workout_gym', // STRENGTH_TRAINING
  80: 'workout_gym', // WEIGHTLIFTING
  36: 'workout_gym', // HIGH_INTENSITY_INTERVAL_TRAINING
  25: 'workout_gym', // ELLIPTICAL
  68: 'workout_gym', // STAIR_CLIMBING
  86: 'yoga', // YOGA
  55: 'yoga', // PILATES
  26: 'dance', // DANCING
  62: 'skating', // ROLLER_SKATING (approx; Skating family)
  33: 'watersports', // GUIDED_BREATHING? — placeholder, refine on device
  71: 'watersports', // SURFING
  60: 'watersports', // SAILING? refine
  45: 'kayaking', // KAYAKING? refine
  63: 'kayaking', // ROWING
  65: 'snowsports', // SKIING
  66: 'snowboarding', // SNOWBOARDING
  61: 'rock_climbing', // ROCK_CLIMBING
  47: 'tae_kwon_do', // MARTIAL_ARTS
  10: 'tae_kwon_do', // BOXING
  15: 'cricket', // CRICKET
  64: 'team_sport', // RUGBY
  6: 'team_sport', // BASKETBALL
  29: 'team_sport', // FOOTBALL_SOCCER? refine
  76: 'team_sport', // TABLE? refine — placeholder
  75: 'solo_sport', // TENNIS? refine
  34: 'solo_sport', // GOLF? refine
  5: 'solo_sport', // BADMINTON
};

const normalise = (raw: string): string => raw.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Best-effort map from a platform activity identifier (numeric HC code or
 * HealthKit name string) to an app activity key. Returns null when unmatched.
 *
 * NOTE: several Health Connect codes above are marked "refine" — verify the
 * exact enum values against the installed react-native-health-connect version
 * on a real device before shipping, since Google has renumbered them across
 * releases.
 */
export const mapPlatformActivityType = (sourceActivityType: string): AppActivityType | null => {
  if (!sourceActivityType) return null;
  const asNumber = Number(sourceActivityType);
  if (Number.isInteger(asNumber) && HC_CODE_TO_ACTIVITY[asNumber]) {
    return HC_CODE_TO_ACTIVITY[asNumber];
  }
  return ALIAS_TO_ACTIVITY[normalise(sourceActivityType)] ?? null;
};
