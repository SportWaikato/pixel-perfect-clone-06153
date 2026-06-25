import { ACTIVITY_TYPES } from '@/models/activities/interfaces/ActivityInterface';
import { getActivityIcon, getActivityColor } from '@/modules/activities/utils/activityIcons';
import { WizardState, EVENT_TYPE_TO_ACTIVITY_TYPE } from './types';
import { EventInterface } from '@/models/events/interfaces/EventInterface';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';
import { Input } from '@/modules/application/components/DesignSystem/ui/input';

const FEATURED_TYPES = ['run_jog', 'bike_cycle', 'walk_hike', 'scooter_skate'] as const;

interface Step2ActivityTypeProps {
  data: WizardState;
  challenges: EventInterface[];
  onChange: (updates: Partial<WizardState>) => void;
}

const Step2ActivityType = ({ data, challenges, onChange }: Step2ActivityTypeProps) => {
  const selectedChallenge = challenges.find((c) => c.id === data.eventId);
  const lockedType = selectedChallenge
    ? EVENT_TYPE_TO_ACTIVITY_TYPE[selectedChallenge.event_type]
    : null;

  const handleSelect = (type: string) => {
    if (lockedType) return;
    onChange({ activityType: type, customActivityName: type !== 'something_else' ? '' : data.customActivityName });
  };

  const remainingTypes = Object.entries(ACTIVITY_TYPES).filter(
    ([key]) => !FEATURED_TYPES.includes(key as typeof FEATURED_TYPES[number])
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-[#0B4B39] mb-1">What did you do?</h2>
        <p className="text-gray-500 text-sm">Choose the activity that best describes what you did.</p>
      </div>

      {lockedType ? (
        <div className="p-4 rounded-2xl border border-[#cf04d2] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#0B4B39]/10" style={{ color: '#0B4B39' }}>
              {getActivityIcon(lockedType, 22)}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{ACTIVITY_TYPES[lockedType as keyof typeof ACTIVITY_TYPES]}</p>
              <p className="text-xs text-gray-500">Activity type set by challenge</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {FEATURED_TYPES.map((type) => {
              const isSelected = data.activityType === type;
              const color = getActivityColor(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelect(type)}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-150 ${
                    isSelected
                      ? 'border-[#cf04d2] bg-[#0B4B39]/5 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {getActivityIcon(type, 22)}
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {ACTIVITY_TYPES[type as keyof typeof ACTIVITY_TYPES]}
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <Select
              value={FEATURED_TYPES.includes(data.activityType as typeof FEATURED_TYPES[number]) ? '' : data.activityType}
              onValueChange={(val) => handleSelect(val)}
            >
              <SelectTrigger className="w-full rounded-xl border-[3px] border-gray-200">
                <SelectValue placeholder="Something else?" />
              </SelectTrigger>
              <SelectContent>
                {remainingTypes.map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {data.activityType === 'something_else' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">What activity did you do?</label>
              <Input
                value={data.customActivityName}
                onChange={(e) => onChange({ customActivityName: e.target.value })}
                placeholder="Describe your activity"
                className="rounded-xl border"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Step2ActivityType;
