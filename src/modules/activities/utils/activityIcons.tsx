// Feeling mappings for consistent UI display
export const FEELING_MAPPINGS = {
  very_sad: { emoji: "😒", label: "Disappointed" },
  sad: { emoji: "🫤", label: "Sad" },
  average: { emoji: "😐", label: "Average" },
  happy: { emoji: "😊", label: "Happy" },
  very_happy: { emoji: "😁", label: "Excited" },
} as const;

export const getFeelingEmoji = (feeling: string): string => {
  return FEELING_MAPPINGS[feeling as keyof typeof FEELING_MAPPINGS]?.emoji || "😐";
};

export const getFeelingLabel = (feeling: string): string => {
  return FEELING_MAPPINGS[feeling as keyof typeof FEELING_MAPPINGS]?.label || feeling;
};

export const getFeelingDisplay = (feeling: string): string => {
  const mapping = FEELING_MAPPINGS[feeling as keyof typeof FEELING_MAPPINGS];
  return mapping ? `${mapping.emoji} ${mapping.label}` : feeling;
};

const glyphSrc: Record<string, string> = {
  walking: "/glyphs/Walking.png",
  running: "/glyphs/Run.png",
  cycling: "/glyphs/Cycling.png",
  swimming: "/glyphs/Swimming.png",
  team_sports: "/glyphs/Team training.png",
  gym_fitness: "/glyphs/Gym_Workout.png",
  dance: "/glyphs/Dance.png",
  other: "/glyphs/Walking.png",

  run_jog: "/glyphs/Run.png",
  walk_hike: "/glyphs/Walking.png",
  bike_cycle: "/glyphs/Cycling.png",
  team_sport: "/glyphs/Team training.png",
  solo_sport: "/glyphs/Golf.png",
  workout_gym: "/glyphs/Gym_Workout.png",
  scooter_skate: "/glyphs/Ice Skating.png",
  kapa_haka: "/glyphs/Kapa Haka.png",
  hunting_diving: "/glyphs/Hunting.png",
  active_games: "/glyphs/Badminton.png",
  watersports: "/glyphs/Surfing.png",
  snowsports: "/glyphs/Skiing.png",
  gamefit_vr: "/glyphs/VR.png",
  yoga: "/glyphs/YogaPilates.png",
  ballet: "/glyphs/Ballet.png",
  bmx: "/glyphs/BMX.png",
  cricket: "/glyphs/Cricket.png",
  kayaking: "/glyphs/Kayaking.png",
  pickleball: "/glyphs/Pickleball.png",
  rock_climbing: "/glyphs/Rock Climbing.png",
  snowboarding: "/glyphs/Snowboarding.png",
  tae_kwon_do: "/glyphs/Tae-Kwon-Do.png",
  tramping: "/glyphs/Tramping.png",
  training_practice: "/glyphs/Team training.png",
  game_day_competition: "/glyphs/Team training.png",
  something_else: "/glyphs/Walking.png",

  rugby: "/glyphs/Rugby.png",
  soccer: "/glyphs/Soccer.png",
  basketball: "/glyphs/Basketball.png",
  volleyball: "/glyphs/Volleyball.png",
  hockey: "/glyphs/Hockey.png",
  tennis: "/glyphs/Tennis.png",
  table_tennis: "/glyphs/Table Tennis.png",
  golf: "/glyphs/Golf.png",
  gymnastics: "/glyphs/Gymnastics.png",
  rowing: "/glyphs/Rowing.png",
  martial_arts: "/glyphs/Karate.png",
  boxing: "/glyphs/Boxing.png",
  fencing: "/glyphs/Fencing.png",
  archery: "/glyphs/Archery.png",
  athletics: "/glyphs/Run.png",
  softball: "/glyphs/Softball.png",
  horse_riding: "/glyphs/Horse Riding.png",
  water_polo: "/glyphs/Waterpolo.png",
  ice_skating: "/glyphs/Ice Skating.png",
  football: "/glyphs/Soccer.png",
  surfing: "/glyphs/Surfing.png",
};

// Resolves the icon key for a challenge/event, falling back to event_type when no icon is explicitly set.
// 'mixed' challenges fall back to team_sports (Group glyph).
export const resolveEventIconType = (event: {
  icon_type?: string | null;
  event_type?: string | null;
}): string => {
  if (event.icon_type) return event.icon_type;
  const t = event.event_type ?? "";
  return t === "mixed" ? "team_sports" : t || "active_games";
};

export const getActivityIcon = (activityType: string, size = 20) => {
  const src = glyphSrc[activityType] ?? "/glyphs/Walking.png";
  return <img src={src} width={size} height={size} alt={activityType} className="object-contain" />;
};

export const getActivityColor = (activityType: string) => {
  switch (activityType) {
    case "walking":
    case "walk_hike":
    case "tramping":
      return "#0F8061";
    case "running":
    case "run_jog":
    case "athletics":
      return "#D103D1";
    case "cycling":
    case "bike_cycle":
    case "bmx":
      return "#0B4B39";
    case "swimming":
      return "#0B4B39";
    case "team_sports":
    case "team_sport":
    case "training_practice":
    case "game_day_competition":
      return "#DB4FDB";
    case "gym_fitness":
    case "workout_gym":
      return "#0F8061";
    case "dance":
    case "kapa_haka":
    case "ballet":
      return "#D103D1";
    case "solo_sport":
    case "archery":
      return "#19AA4B";
    case "scooter_skate":
    case "ice_skating":
    case "snowboarding":
    case "snowsports":
      return "#00ACEF";
    case "hunting_diving":
    case "rock_climbing":
      return "#0B4B39";
    case "active_games":
    case "pickleball":
      return "#DB4FDB";
    case "gamefit_vr":
      return "#803E93";
    case "yoga":
    case "gymnastics":
    case "tennis":
      return "#803E93";
    case "watersports":
    case "surfing":
    case "kayaking":
    case "rowing":
    case "water_polo":
      return "#0B4B39";
    case "rugby":
    case "boxing":
    case "martial_arts":
    case "tae_kwon_do":
    case "fencing":
      return "#EF4250";
    case "soccer":
    case "hockey":
    case "golf":
    case "horse_riding":
      return "#19AA4B";
    case "basketball":
    case "softball":
    case "cricket":
      return "#F6C031";
    case "volleyball":
    case "table_tennis":
      return "#00ACEF";
    case "football":
      return "#803E93";
    case "something_else":
    case "other":
      return "#6B7280";
    default:
      return "#0B4B39";
  }
};
