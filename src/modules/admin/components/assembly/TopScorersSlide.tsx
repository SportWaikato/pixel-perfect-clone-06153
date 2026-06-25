'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { AssemblyService } from '@/models/assembly/services/AssemblyService';
import { HouseTopScorer } from '@/models/assembly/interfaces/AssemblyWinnerInterface';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';

interface TopScorersSlideProps {
  schoolId: string;
  onBack: () => void;
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
}

const TopScorersSlide = ({ schoolId, onBack, startDate, endDate, periodLabel }: TopScorersSlideProps) => {
  const [scorers, setScorers] = useState<HouseTopScorer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const service = new AssemblyService(createSupabaseClient());
        const data = startDate && endDate
          ? await service.getTopScorersByHouseForDateRange(schoolId, startDate, endDate, 5)
          : await service.getTopScorersByHouseThisWeek(schoolId, 5);
        setScorers(data);

        if (data.length > 0) {
          const confetti = (await import('canvas-confetti')).default;
          confetti({ particleCount: 220, spread: 160, origin: { y: 0.4 }, colors: ['#FFD700', '#ffffff', '#19AA4B', '#803E93'] });
        }
      } catch (err) {
        notifyAboutError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId, startDate, endDate]);

  const houseIds = Array.from(new Set(scorers.map(s => s.house_id)));
  const houseGroups = houseIds.map(houseId => {
    const members = scorers.filter(s => s.house_id === houseId);
    return { houseId, houseName: members[0].house_name, houseColor: members[0].house_color, members };
  });

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
        <Image src="/assembly/top-score-by-houseicon.svg" alt="" width={64} height={64} className="mx-auto mb-3" />
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white">Top Scorers by House This Week</h2>
        <p className="mt-1 text-sm uppercase tracking-wider" style={{ color: '#FF6B2B' }}>Shout out to the top contributors this week</p>
      </div>

      {loading ? (
        <p className="text-white/50 animate-pulse">Loading...</p>
      ) : houseGroups.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-12 py-16 text-center backdrop-blur-sm">
          <p className="text-2xl font-semibold text-white/60">No scores yet</p>
          <p className="mt-2 text-sm text-white/30">No activities logged for this period.</p>
        </div>
      ) : (
        <div className="grid w-full max-w-4xl grid-cols-2 gap-5">
          {houseGroups.map((group, gi) => (
            <m.div
              key={group.houseId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.1, duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.houseColor }}
                />
                <span className="font-bold text-white">{group.houseName}</span>
              </div>
              <div className="space-y-3">
                {group.members.map((scorer, ri) => (
                  <div key={scorer.user_id} className="flex items-center gap-3">
                    {ri < 3 ? (
                      <span className="text-2xl">{ri === 0 ? '🥇' : ri === 1 ? '🥈' : '🥉'}</span>
                    ) : (
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/60">
                        {ri + 1}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold text-white">
                        {scorer.user_first_name} {scorer.user_last_name}
                      </p>
                    </div>
                    <span className="text-xl font-extrabold text-amber-400">{scorer.total_points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </m.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopScorersSlide;
