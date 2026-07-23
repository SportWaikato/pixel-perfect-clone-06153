export const FEELING_MAPPINGS = {
  very_sad: { emoji: "\uD83D\uDE12", label: "Disappointed" },
  sad: { emoji: "\uD83D\uDE24", label: "Sad" },
  average: { emoji: "\uD83D\uDE10", label: "Average" },
  happy: { emoji: "\uD83D\uDE0A", label: "Happy" },
  very_happy: { emoji: "\uD83D\uDE01", label: "Excited" },
} as const;

export const getFeelingEmoji = (feeling: string): string => {
  return FEELING_MAPPINGS[feeling as keyof typeof FEELING_MAPPINGS]?.emoji || "\uD83D\uDE10";
};

export const getFeelingLabel = (feeling: string): string => {
  return FEELING_MAPPINGS[feeling as keyof typeof FEELING_MAPPINGS]?.label || feeling;
};

export const getFeelingDisplay = (feeling: string): string => {
  const mapping = FEELING_MAPPINGS[feeling as keyof typeof FEELING_MAPPINGS];
  return mapping ? `${mapping.emoji} ${mapping.label}` : feeling;
};

const glyphSrc: Record<string, string> = {
  rugby: "/glyphs/Rugby.png",
  netball: "/glyphs/Netball.png",
  basketball: "/glyphs/Basketball.png",
  soccer: "/glyphs/Soccer.png",
  hockey: "/glyphs/Hockey.png",
  volleyball: "/glyphs/Volleyball.png",
  tennis: "/glyphs/Tennis.png",
  badminton: "/glyphs/Badminton.png",
  athletics: "/glyphs/Athletics.png",
  table_tennis: "/glyphs/Table Tennis.png",
  golf: "/glyphs/Golf.png",
  gymnastics: "/glyphs/Gymnastics.png",
  rowing: "/glyphs/Rowing.png",
  karate: "/glyphs/Karate.png",
  boxing: "/glyphs/Boxing.png",
  fencing: "/glyphs/Fencing.png",
  archery: "/glyphs/Archery.png",
  softball: "/glyphs/Softball.png",
  horse_riding: "/glyphs/Horse Riding.png",
  water_polo: "/glyphs/Waterpolo.png",
  ice_skating: "/glyphs/Ice Skating.png",
  walk_hike: "/glyphs/Walking.png",
  run_jog: "/glyphs/Run.png",
  bike_cycle: "/glyphs/Cycling.png",
  swimming: "/glyphs/Swimming.png",
  surfing: "/glyphs/Surfing.png",
  skateboarding: "/glyphs/Skateboarding.png",
  kayaking: "/glyphs/Kayaking.png",
  rock_climbing: "/glyphs/Rock Climbing.png",
  workout_gym: "/glyphs/Gym_Workout.png",
  yoga: "/glyphs/Yoga_Pilates.png",
  dance: "/glyphs/Dance.png",
  kapa_haka: "/glyphs/Kapa Haka.png",
  hunting: "/glyphs/Hunting.png",
  skiing: "/glyphs/Skiing.png",
  snowboarding: "/glyphs/Snowboarding.png",
  gamefit_vr: "/glyphs/VR.png",
  bmx: "/glyphs/BMX.png",
  cricket: "/glyphs/Cricket.png",
  pickleball: "/glyphs/Pickleball.png",
  scootering: "/glyphs/Scooter.png",
  tramping: "/glyphs/Tramping.png",
  ballet: "/glyphs/Ballet.png",
  active_games: "/glyphs/Active Games.png",
  touch_rugby: "/glyphs/Touch Rugby.png",
  waka_ama: "/glyphs/Waka Ama.png",
  rugby_league: "/glyphs/Rugby.png",
  squash: "/glyphs/Squash.png",
  disc_golf: "/glyphs/Disc Golf.png",
  surf_lifesaving: "/glyphs/Surf Life-Saving.png",
  futsal: "/glyphs/Futsal.png",
  lawn_bowls: "/glyphs/Lawn Bowls.png",
  triathlon: "/glyphs/Triathalon.png",
  trail_running: "/glyphs/Trail running.png",
  tae_kwon_do: "/glyphs/Tae-Kwon-Do.png",
  something_else: "/glyphs/Something Else.png",
  survey_completion: "/glyphs/Walking.png",

  // Legacy types — keep resolvable for historical records
  scooter_skate: "/glyphs/Scooter.png",
  team_sport: "/glyphs/Team training.png",
  training_practice: "/glyphs/Team training.png",
  game_day_competition: "/glyphs/Team training.png",
  solo_sport: "/glyphs/Golf.png",
  skating: "/glyphs/Skateboarding.png",
  hunting_diving: "/glyphs/Hunting.png",
  watersports: "/glyphs/Surfing.png",
  snowsports: "/glyphs/Skiing.png",
  football: "/glyphs/Soccer.png",
  walking: "/glyphs/Walking.png",
  running: "/glyphs/Run.png",
  cycling: "/glyphs/Cycling.png",
  team_sports: "/glyphs/Team training.png",
  gym_fitness: "/glyphs/Gym_Workout.png",

  // Lookup helpers for challenge/event icons
  rugby_union: "/glyphs/Rugby.png",
  mixed: "/glyphs/Team training.png",
  other: "/glyphs/Something Else.png",
};

export const resolveEventIconType = (event: {
  icon_type?: string | null;
  event_type?: string | null;
}): string => {
  if (event.icon_type) return event.icon_type;
  const t = event.event_type ?? "";
  return t === "mixed" ? "team_sports" : t || "active_games";
};

export const getActivityIcon = (activityType: string, size = 20) => {
  const src = glyphSrc[activityType] ?? "/glyphs/Something Else.png";
  return <img src={src} width={size} height={size} alt={activityType} className="object-contain" />;
};

export const getActivityColor = (activityType: string) => {
  switch (activityType) {
    case "walk_hike":
    case "tramping":
    case "trail_running":
    case "walking":
      return "#0F8061";
    case "run_jog":
    case "athletics":
    case "running":
      return "#D103D1";
    case "bike_cycle":
    case "bmx":
    case "cycling":
      return "#1B5E4B";
    case "swimming":
    case "surf_lifesaving":
      return "#1B5E4B";
    case "rugby":
    case "netball":
    case "touch_rugby":
    case "rugby_league":
    case "team_sport":
    case "training_practice":
    case "game_day_competition":
      return "#DB4FDB";
    case "workout_gym":
    case "triathlon":
    case "gym_fitness":
      return "#0F8061";
    case "dance":
    case "kapa_haka":
    case "ballet":
      return "#D103D1";
    case "cricket":
    case "softball":
    case "baseball":
      return "#F6C031";
    case "basketball":
    case "netball":
      return "#F6C031";
    case "soccer":
    case "futsal":
    case "hockey":
    case "football":
      return "#19AA4B";
    case "volleyball":
    case "table_tennis":
      return "#00ACEF";
    case "tennis":
    case "pickleball":
    case "squash":
    case "badminton":
      return "#DB4FDB";
    case "golf":
    case "disc_golf":
    case "lawn_bowls":
      return "#19AA4B";
    case "gymnastics":
    case "yoga":
      return "#803E93";
    case "rowing":
    case "kayaking":
    case "waka_ama":
    case "water_polo":
      return "#1B5E4B";
    case "karate":
    case "boxing":
    case "fencing":
    case "tae_kwon_do":
    case "martial_arts":
      return "#EF4250";
    case "archery":
    case "hunting":
    case "hunting_diving":
      return "#1B5E4B";
    case "horse_riding":
      return "#19AA4B";
    case "ice_skating":
    case "skating":
    case "skateboarding":
    case "scootering":
    case "snowboarding":
    case "skiing":
    case "snowsports":
    case "scooter_skate":
      return "#00ACEF";
    case "surfing":
    case "watersports":
      return "#1B5E4B";
    case "rock_climbing":
      return "#1B5E4B";
    case "gamefit_vr":
      return "#803E93";
    case "active_games":
    case "something_else":
    case "other":
      return "#6B7280";
    default:
      return "#1B5E4B";
  }
};
