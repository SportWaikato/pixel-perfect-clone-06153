'use client';

import { getActivityIcon, getActivityColor } from '@/modules/activities/utils/activityIcons';

const ICON_OPTIONS: { value: string; label: string }[] = [
  // General activity types
  { value: 'run_jog', label: 'Run / Jog' },
  { value: 'walk_hike', label: 'Walk / Hike' },
  { value: 'bike_cycle', label: 'Bike / Cycle' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'surfing', label: 'Surfing' },
  { value: 'watersports', label: 'Watersports' },
  { value: 'workout_gym', label: 'Gym / Workout' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'gymnastics', label: 'Gymnastics' },
  { value: 'scooter_skate', label: 'Scooter / Skate' },
  { value: 'ice_skating', label: 'Ice Skating' },
  { value: 'snowsports', label: 'Snow Sports' },
  { value: 'kapa_haka', label: 'Kapa Haka' },
  { value: 'hunting_diving', label: 'Hunting / Diving' },
  { value: 'active_games', label: 'Active Games' },
  { value: 'gamefit_vr', label: 'GameFit / VR' },
  { value: 'something_else', label: 'Other' },
  // Team sports
  { value: 'rugby', label: 'Rugby' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'football', label: 'Football' },
  { value: 'water_polo', label: 'Water Polo' },
  { value: 'softball', label: 'Softball' },
  { value: 'team_sport', label: 'Team Sport' },
  // Individual sports
  { value: 'tennis', label: 'Tennis' },
  { value: 'table_tennis', label: 'Table Tennis' },
  { value: 'golf', label: 'Golf' },
  { value: 'rowing', label: 'Rowing' },
  { value: 'athletics', label: 'Athletics' },
  { value: 'archery', label: 'Archery' },
  { value: 'boxing', label: 'Boxing' },
  { value: 'martial_arts', label: 'Martial Arts' },
  { value: 'fencing', label: 'Fencing' },
  { value: 'horse_riding', label: 'Horse Riding' },
  { value: 'solo_sport', label: 'Solo Sport' },
];

interface EventIconPickerProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
}

const EventIconPicker = ({ value, onChange }: EventIconPickerProps) => {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Challenge Icon</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {ICON_OPTIONS.map((opt) => {
          const color = getActivityColor(opt.value);
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.label}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all"
              style={{
                borderColor: isSelected ? color : 'transparent',
                backgroundColor: isSelected ? `${color}18` : '#f9fafb',
              }}
            >
              <div style={{ color }}>{getActivityIcon(opt.value, 20)}</div>
              <span className="text-[9px] text-center leading-tight text-gray-500 line-clamp-2">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EventIconPicker;
export { ICON_OPTIONS };
