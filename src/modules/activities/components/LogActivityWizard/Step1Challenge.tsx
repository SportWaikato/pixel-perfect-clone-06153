
import { useRef, useState } from 'react';
import { EventInterface } from '@/models/events/interfaces/EventInterface';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { getActivityIcon, resolveEventIconType } from '@/modules/activities/utils/activityIcons';
import { Zap, Calendar, Signpost } from 'lucide-react';
import { formatEventDate } from '@/modules/common/utils/dateUtils';
import { WizardState } from './types';

interface Step1ChallengeProps {
  data: WizardState;
  challenges: EventInterface[];
  onChange: (updates: Partial<WizardState>) => void;
}


const Step1Challenge = ({ data, challenges, onChange }: Step1ChallengeProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 4);
  };

  const handleSelectChallenge = (challenge: EventInterface) => {
    onChange({ eventId: challenge.id });
  };

  const handleSelectGeneral = () => {
    onChange({ eventId: '' });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-[#0B4B39] mb-1">Link to a challenge?</h2>
        <p className="text-gray-500 text-sm">Link your activity to earn bonus points or challenge rewards.</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleSelectGeneral}
          className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 bg-white ${
            data.eventId === ''
              ? 'border-[#cf04d2]'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#0B4B39' }}
            >
              <Signpost size={18} className="text-white" />
            </div>
            <p className="font-semibold text-[#0B4B39]">No challenge — general activity</p>
          </div>
        </button>

        {challenges.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No active challenges right now.
          </div>
        ) : (
          <div className="relative">
            <div ref={scrollRef} onScroll={handleScroll} className="overflow-y-auto max-h-64 space-y-3 pr-1 scrollbar-thin">
              {challenges.map((challenge) => {
                const activityType = resolveEventIconType(challenge);

                return (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() => handleSelectChallenge(challenge)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 bg-white ${
                      data.eventId === challenge.id
                        ? 'border-[#cf04d2]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                        {getActivityIcon(activityType, 32)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#0B4B39] truncate">{challenge.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Calendar size={12} />
                          <span>Until {formatEventDate(challenge.end_date, 'MMM d')}</span>
                        </div>
                      </div>
                      {challenge.challenge_points ? (
                        <Badge className="bg-orange-100 text-orange-600 text-xs shrink-0">
                          <Zap size={10} className="mr-1" />
                          {challenge.challenge_points} pts
                        </Badge>
                      ) : challenge.points_multiplier && challenge.points_multiplier > 1 ? (
                        <Badge className="bg-orange-100 text-orange-600 text-xs shrink-0">
                          <Zap size={10} className="mr-1" />
                          {challenge.points_multiplier}× pts
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            {challenges.length > 2 && !isAtBottom && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-1 h-10 rounded-b-2xl bg-gradient-to-t from-[#f8fefc] to-transparent" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step1Challenge;
