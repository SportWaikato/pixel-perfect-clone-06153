import Image from 'next/image';

// Feeling mappings for consistent UI display
export const FEELING_MAPPINGS = {
  very_sad: { emoji: '😒', label: 'Disappointed' },
  sad: { emoji: '🫤', label: 'Sad' },
  average: { emoji: '😐', label: 'Average' },
  happy: { emoji: '😊', label: 'Happy' },
  very_happy: { emoji: '😁', label: 'Excited' },
} as const;

export const getFeelingEmoji = (feeling: string): string => {
  return FEELING_MAPPINGS[feeling as keyof typeof FEELING_MAPPINGS]?.emoji || '😐';
};

export const getFeelingLabel = (feeling: string): string => {
  return FEELING_MAPPINGS[feeling as keyof typeof FEELING_MAPPINGS]?.label || feeling;
};

export const getFeelingDisplay = (feeling: string): string => {
  const mapping = FEELING_MAPPINGS[feeling as keyof typeof FEELING_MAPPINGS];
  return mapping ? `${mapping.emoji} ${mapping.label}` : feeling;
};

const glyphSrc: Record<string, string> = {
  // Original activity types
  walking:        '/glyphs/Walk.svg',
  running:        '/glyphs/Run.svg',
  cycling:        '/glyphs/Bike.svg',
  swimming:       '/glyphs/Swimming.svg',
  team_sports:    '/glyphs/Group.svg',
  gym_fitness:    '/glyphs/Lifting.svg',
  dance:          '/glyphs/Cheer.svg',
  other:          '/glyphs/Outdoors.svg',

  // NZ-relevant activity types
  run_jog:        '/glyphs/Run.svg',
  walk_hike:      '/glyphs/Hiking.svg',
  bike_cycle:     '/glyphs/Bike.svg',
  team_sport:     '/glyphs/Group.svg',
  solo_sport:     '/glyphs/Archery.svg',
  workout_gym:    '/glyphs/Lifting.svg',
  scooter_skate:  '/glyphs/skateboarding-skateboarder.svg',
  kapa_haka:      '/glyphs/Cheer.svg',
  hunting_diving: '/glyphs/Shooting.svg',
  active_games:   '/glyphs/Ball-Thrown.svg',
  watersports:    '/glyphs/Surfing.svg',
  snowsports:     '/glyphs/Skii.svg',
  gamefit_vr:     '/glyphs/Gymnastics.svg',
  yoga:           '/glyphs/Yoga.svg',
  something_else: '/glyphs/Outdoors.svg',

  // Sport-specific types
  rugby:          '/glyphs/Rugby.svg',
  soccer:         '/glyphs/Soccer.svg',
  basketball:     '/glyphs/Basketball.svg',
  volleyball:     '/glyphs/Volleyball.svg',
  hockey:         '/glyphs/Hockey.svg',
  tennis:         '/glyphs/Tennis.svg',
  table_tennis:   '/glyphs/Table-Tennis.svg',
  golf:           '/glyphs/Golf.svg',
  gymnastics:     '/glyphs/Gymnastics.svg',
  rowing:         '/glyphs/Rowing.svg',
  martial_arts:   '/glyphs/Karate.svg',
  boxing:         '/glyphs/Boxing.svg',
  fencing:        '/glyphs/Fencing.svg',
  archery:        '/glyphs/Archery.svg',
  athletics:      '/glyphs/Hurdle.svg',
  softball:       '/glyphs/Softball.svg',
  horse_riding:   '/glyphs/Horse-Riding.svg',
  water_polo:     '/glyphs/Water-Polo.svg',
  ice_skating:    '/glyphs/Ice-Skate.svg',
  football:       '/glyphs/Football.svg',
  surfing:        '/glyphs/Surfing.svg',
};

// Resolves the icon key for a challenge/event, falling back to event_type when no icon is explicitly set.
// 'mixed' challenges fall back to team_sports (Group glyph).
export const resolveEventIconType = (event: { icon_type?: string | null; event_type?: string | null }): string => {
  if (event.icon_type) return event.icon_type;
  const t = event.event_type ?? '';
  return t === 'mixed' ? 'team_sports' : (t || 'active_games');
};

export const getActivityIcon = (activityType: string, size = 20) => {
  const src = glyphSrc[activityType] ?? '/glyphs/Outdoors.svg';
  return <Image src={src} width={size} height={size} alt={activityType} className="object-contain" />;
};

export const getActivityColor = (activityType: string) => {
  switch (activityType) {
    case 'walking':
    case 'walk_hike':
      return '#0F8061';
    case 'running':
    case 'run_jog':
      return '#D103D1';
    case 'cycling':
    case 'bike_cycle':
      return '#0B4B39';
    case 'swimming':
    case 'watersports':
    case 'surfing':
      return '#0B4B39';
    case 'team_sports':
    case 'team_sport':
      return '#DB4FDB';
    case 'gym_fitness':
    case 'workout_gym':
      return '#0F8061';
    case 'dance':
    case 'kapa_haka':
      return '#D103D1';
    case 'solo_sport':
    case 'archery':
      return '#19AA4B';
    case 'scooter_skate':
    case 'ice_skating':
      return '#00ACEF';
    case 'hunting_diving':
      return '#0B4B39';
    case 'active_games':
      return '#DB4FDB';
    case 'snowsports':
      return '#00ACEF';
    case 'gamefit_vr':
      return '#803E93';
    case 'yoga':
    case 'gymnastics':
      return '#803E93';
    case 'rugby':
    case 'boxing':
    case 'martial_arts':
      return '#EF4250';
    case 'soccer':
    case 'hockey':
    case 'golf':
    case 'horse_riding':
      return '#19AA4B';
    case 'basketball':
    case 'softball':
    case 'athletics':
      return '#F6C031';
    case 'volleyball':
    case 'table_tennis':
    case 'rowing':
    case 'water_polo':
      return '#00ACEF';
    case 'tennis':
    case 'fencing':
    case 'football':
      return '#803E93';
    case 'something_else':
    case 'other':
      return '#6B7280';
    default:
      return '#0B4B39';
  }
};
