"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { AssemblyService } from "@/models/assembly/services/AssemblyService";
import { SchoolTermService } from "@/models/terms/services/SchoolTermService";
import { HouseWeeklyPoints } from "@/models/assembly/interfaces/AssemblyWinnerInterface";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";

interface HouseStats {
  house_id: string;
  house_name: string;
  house_color: string;
  weekly_points: number;
  term_points: number;
  lifetime_points: number;
}

interface HouseStatisticsSlideProps {
  schoolId: string;
  onBack: () => void;
}

const HouseStatisticsSlide = ({ schoolId, onBack }: HouseStatisticsSlideProps) => {
  const [stats, setStats] = useState<HouseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [termName, setTermName] = useState("Current Term");

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createSupabaseClient();
        const assemblyService = new AssemblyService(supabase);
        const termService = new SchoolTermService(supabase);

        const [weeklyData, currentTerm] = await Promise.all([
          assemblyService.getHouseLeaderboardLastNDays(schoolId, 7),
          termService.getCurrentTerm(schoolId),
        ]);

        if (currentTerm) {
          setTermName(`Term ${currentTerm.term_number} ${currentTerm.year}`);
        }

        const housesWithLifetime = await supabase
          .from("houses")
          .select("id, name, color, total_points")
          .eq("school_id", schoolId);

        if (housesWithLifetime.error) throw new Error(housesWithLifetime.error.message);

        const lifetimeMap = new Map(
          (housesWithLifetime.data || []).map((h) => [h.id, h.total_points || 0] as const),
        );

        const termPointsPromises = weeklyData.map(async (house) => {
          let termPoints = 0;
          if (currentTerm) {
            try {
              termPoints = await termService.getTermPointsForHouse(house.house_id, currentTerm.id);
            } catch {
              termPoints = 0;
            }
          }
          return {
            house_id: house.house_id,
            house_name: house.house_name,
            house_color: house.house_color,
            weekly_points: house.weekly_points,
            term_points: termPoints,
            lifetime_points: lifetimeMap.get(house.house_id) || 0,
          };
        });

        const result = await Promise.all(termPointsPromises);
        result.sort((a, b) => b.weekly_points - a.weekly_points);
        setStats(result);

        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 180,
          spread: 140,
          origin: { y: 0.4 },
          colors: ["#FFD700", "#ffffff", "#19AA4B", "#00ACEF"],
        });
      } catch (err) {
        notifyAboutError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId]);

  const maxLifetime = Math.max(...stats.map((s) => s.lifetime_points), 1);

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
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <span className="text-3xl">&#x1F4CA;</span>
        </div>
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white">
          House Statistics
        </h2>
        <p className="mt-1 text-sm uppercase tracking-wider" style={{ color: "#FF6B2B" }}>
          7-Day &#183; {termName} &#183; Lifetime
        </p>
      </div>

      {loading ? (
        <p className="animate-pulse text-white/50">Loading...</p>
      ) : (
        <div className="w-full max-w-4xl">
          <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="grid grid-cols-4 gap-2 border-b border-white/10 px-6 py-3 text-xs uppercase tracking-wider text-white/40">
              <span>House</span>
              <span className="text-center">7 Days</span>
              <span className="text-center">{termName}</span>
              <span className="text-center">Lifetime</span>
            </div>
            {stats.map((house, i) => (
              <m.div
                key={house.house_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className={`grid grid-cols-4 items-center gap-2 px-6 py-4 ${i < stats.length - 1 ? "border-b border-white/5" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3.5 w-3.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: house.house_color }}
                  />
                  <span className="truncate font-bold text-white">{house.house_name}</span>
                </div>
                <p className="text-center text-lg font-extrabold text-white">
                  {house.weekly_points.toLocaleString()}
                </p>
                <p className="text-center text-lg font-extrabold text-amber-400">
                  {house.term_points.toLocaleString()}
                </p>
                <div>
                  <p className="text-center text-lg font-extrabold text-white">
                    {house.lifetime_points.toLocaleString()}
                  </p>
                  <div className="mt-1 h-1 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(house.lifetime_points / maxLifetime) * 100}%`,
                        backgroundColor: house.house_color,
                      }}
                    />
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HouseStatisticsSlide;
