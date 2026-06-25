
import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
;
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { AssemblyService } from '@/models/assembly/services/AssemblyService';
import { HouseWeeklyPoints } from '@/models/assembly/interfaces/AssemblyWinnerInterface';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import PlaceIcon from './PlaceIcon';

interface HouseLeaderboardSlideProps {
  schoolId: string;
  onBack: () => void;
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
}

const HouseLeaderboardSlide = ({ schoolId, onBack, startDate, endDate, periodLabel }: HouseLeaderboardSlideProps) => {
  const [houses, setHouses] = useState<HouseWeeklyPoints[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const service = new AssemblyService(createSupabaseClient());
        const data = startDate && endDate
          ? await service.getHousePointsForDateRange(schoolId, startDate, endDate)
          : await service.getHouseLeaderboardLastNDays(schoolId, 7);
        setHouses(data);

        if (data.some(h => h.weekly_points > 0)) {
          const confetti = (await import('canvas-confetti')).default;
          confetti({ particleCount: 220, spread: 160, origin: { y: 0.4 }, colors: ['#FFD700', '#ffffff', '#19AA4B', '#00ACEF'] });
        }
      } catch (err) {
        notifyAboutError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId, startDate, endDate]);

  // Podium order: [1st, 2nd, 3rd] → render as [2nd, 1st, 3rd], rest shown below
  const first = houses[0] ?? null;
  const second = houses[1] ?? null;
  const third = houses[2] ?? null;
  const rest = houses.slice(3);
  const maxPoints = first?.weekly_points || 1;

  const HouseCard = ({
    house,
    place,
    size,
    delay,
  }: {
    house: HouseWeeklyPoints;
    place: number;
    size: 'large' | 'normal' | 'small';
    delay: number;
  }) => (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-center"
      style={{ padding: size === 'large' ? '1.75rem' : size === 'normal' ? '1.25rem' : '1rem' }}
    >
      <div className="mb-3">
        <PlaceIcon place={place} accentColor={house.house_color} size={size === 'large' ? 96 : size === 'normal' ? 72 : 48} />
      </div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-block flex-shrink-0 ${size === 'large' ? 'h-5 w-5' : size === 'normal' ? 'h-4 w-4' : 'h-3.5 w-3.5'}`}
          style={{ backgroundColor: house.house_color }}
        />
        <span className={`font-bold text-white ${size === 'large' ? 'text-2xl' : size === 'normal' ? 'text-xl' : 'text-base'}`}>{house.house_name}</span>
      </div>
      <p className={`font-extrabold text-white ${size === 'large' ? 'text-5xl' : size === 'normal' ? 'text-4xl' : 'text-2xl'}`}>
        {house.weekly_points.toLocaleString()}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wider text-white/40">Points Earned</p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${(house.weekly_points / maxPoints) * 100}%`, backgroundColor: house.house_color }}
        />
      </div>
    </m.div>
  );

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
        <Image src="/assembly/house-leaderboard-icon.svg" alt="" width={64} height={64} className="mx-auto mb-3" />
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white">House Leaderboard</h2>
        <p className="mt-1 text-sm uppercase tracking-wider" style={{ color: '#FF6B2B' }}>
          {periodLabel ?? 'Points earned this week'}
        </p>
      </div>

      {loading ? (
        <p className="animate-pulse text-white/50">Loading...</p>
      ) : houses.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-12 py-16 text-center backdrop-blur-sm">
          <p className="text-2xl font-semibold text-white/60">No houses found</p>
          <p className="mt-2 text-sm text-white/30">Make sure houses are set up for this school.</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          {/* Podium row: 2nd | 1st | 3rd */}
          <div className="grid grid-cols-3 items-end gap-4">
            {second && <HouseCard house={second} place={2} size="normal" delay={0.1} />}
            {first && <HouseCard house={first} place={1} size="large" delay={0} />}
            {third && <HouseCard house={third} place={3} size="normal" delay={0.2} />}
          </div>

          {/* 4th place and beyond */}
          {rest.length === 1 && (
            <div className="mt-4 flex justify-center">
              <div className="w-1/3">
                <HouseCard house={rest[0]} place={4} size="small" delay={0.35} />
              </div>
            </div>
          )}
          {rest.length > 1 && (
            <div className={`mt-4 grid gap-4 ${rest.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {rest.map((house, i) => (
                <HouseCard key={house.house_id} house={house} place={i + 4} size="small" delay={0.35 + i * 0.1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HouseLeaderboardSlide;
