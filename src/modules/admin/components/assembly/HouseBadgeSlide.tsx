"use client";

import { ASSEMBLY_ICONS } from "./assemblyIcons";
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { ChevronLeft, Trophy, Flame, Target, Users } from "lucide-react";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { AchievementService } from "@/models/achievements/services/AchievementService";
import { HouseAchievementInterface } from "@/models/achievements/interfaces/AchievementInterface";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";

interface HouseBadgeSlideProps {
  schoolId: string;
  onBack: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Trophy: <Trophy className="w-6 h-6 text-yellow-400" />,
  Flame: <Flame className="w-6 h-6 text-brand-pink" />,
  Target: <Target className="w-6 h-6 text-blue-400" />,
  Users: <Users className="w-6 h-6 text-green-400" />,
};

const HouseBadgeSlide = ({ schoolId, onBack }: HouseBadgeSlideProps) => {
  const [badges, setBadges] = useState<HouseAchievementInterface[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const svc = new AchievementService(createSupabaseClient());

        const { data: term } = await createSupabaseClient()
          .from("school_terms")
          .select("id")
          .eq("school_id", schoolId)
          .order("start_date", { ascending: false })
          .limit(1)
          .single();

        const termId = term?.id;
        const data = termId
          ? await svc.getHouseBadgesForTerm(schoolId, termId)
          : await svc.getHouseBadgesForSchool(schoolId);

        setBadges(data);
      } catch (err) {
        notifyAboutError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId]);

  const grouped = badges.reduce(
    (acc, badge) => {
      if (!acc[badge.house_id]) {
        acc[badge.house_id] = {
          house_name: badge.house_name,
          house_color: badge.house_color,
          items: [],
        };
      }
      acc[badge.house_id].items.push(badge);
      return acc;
    },
    {} as Record<
      string,
      { house_name: string; house_color: string; items: HouseAchievementInterface[] }
    >,
  );

  const houseEntries = Object.values(grouped);

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-12">
      <button
        onClick={onBack}
        className="absolute left-6 top-6 rounded-full p-2 transition-colors"
        style={{ backgroundColor: "#d9d8d4", color: "#0f172a" }}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div className="mb-8 text-center">
        <img
          src={ASSEMBLY_ICONS["house-badges"]}
          alt=""
          width={64}
          height={64}
          className="mx-auto mb-3"
        />
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white">
          House Badges
        </h2>
        <p className="mt-1 text-sm uppercase tracking-wider" style={{ color: "#DB4FDB" }}>
          This term&apos;s house achievements
        </p>
      </div>

      {loading ? (
        <p className="animate-pulse text-white/50">Loading...</p>
      ) : houseEntries.length === 0 ? (
        <div className="text-center text-white/60">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-white/30" />
          <p>No house badges earned this term yet.</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl space-y-6">
          {houseEntries.map((entry, i) => (
            <m.div
              key={entry.house_name}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="inline-block h-5 w-5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: entry.house_color }}
                />
                <h3 className="text-xl font-bold text-white">{entry.house_name}</h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {entry.items.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    {ICON_MAP[badge.icon_name] || <Trophy className="w-6 h-6 text-yellow-400" />}
                    <div>
                      <p className="text-sm font-semibold text-white">{badge.achievement_name}</p>
                      <p className="text-xs text-white/50">{badge.achievement_description}</p>
                    </div>
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

export default HouseBadgeSlide;
