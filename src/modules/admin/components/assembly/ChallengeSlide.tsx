import { m } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { EventInterface } from '@/models/events/interfaces/EventInterface';
import { resolveEventIconType, getActivityIcon } from '@/modules/activities/utils/activityIcons';

interface ChallengeSlideProps {
  assemblyEvent: EventInterface | null;
  onBack: () => void;
}

const ChallengeSlide = ({ assemblyEvent, onBack }: ChallengeSlideProps) => {
  const daysToComplete = assemblyEvent
    ? Math.max(0, Math.ceil((new Date(assemblyEvent.end_date).getTime() - Date.now()) / 86400000))
    : null;

  const targetMinutes = assemblyEvent?.target_minutes;

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-12">
      <button
        onClick={onBack}
        className="absolute left-6 top-6 rounded-full p-2 transition-colors"
        style={{ backgroundColor: '#d9d8d4', color: '#0f172a' }}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div className="mb-8 text-center">
        <img src="/assembly/this-week-challenge-Icon.svg" alt="" width={64} height={64} className="mx-auto mb-3" />
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white">Your Next Challenge</h2>
      </div>

      <div className="w-full max-w-2xl">
        {assemblyEvent ? (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white px-10 py-10 text-center shadow-2xl"
          >
            <div className="mb-5 flex justify-center">
              {getActivityIcon(resolveEventIconType(assemblyEvent), 80)}
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900">{assemblyEvent.name}</h3>

            <div className="my-6 flex justify-center gap-6">
              {targetMinutes && (
                <div className="rounded-xl border border-gray-200 px-5 py-3">
                  <p className="text-xl font-extrabold text-gray-900">{targetMinutes}</p>
                  <p className="text-xs text-gray-500">Minutes of activity</p>
                </div>
              )}
              {daysToComplete !== null && (
                <div className="rounded-xl border border-gray-200 px-5 py-3">
                  <p className="text-xl font-extrabold text-gray-900">{daysToComplete}</p>
                  <p className="text-xs text-gray-500">Days to complete</p>
                </div>
              )}
              {assemblyEvent.challenge_points && (
                <div className="rounded-xl border border-gray-200 px-5 py-3">
                  <p className="text-xl font-extrabold text-gray-900">+{assemblyEvent.challenge_points}</p>
                  <p className="text-xs text-gray-500">Bonus points</p>
                </div>
              )}
            </div>

            {assemblyEvent.description && (
              <p className="text-base text-gray-700">{assemblyEvent.description}</p>
            )}
          </m.div>
        ) : (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-white/10 bg-white/5 px-10 py-12 text-center backdrop-blur-sm"
          >
            <p className="text-white/50">No assembly challenge has been set yet.</p>
            <p className="mt-2 text-sm text-white/30">
              Mark a challenge as &ldquo;Feature in Assembly Mode&rdquo; in the Challenges admin to display it here.
            </p>
          </m.div>
        )}
      </div>
    </div>
  );
};

export default ChallengeSlide;
