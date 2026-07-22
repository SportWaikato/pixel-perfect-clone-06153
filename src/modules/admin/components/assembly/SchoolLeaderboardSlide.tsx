"use client";

import { ASSEMBLY_ICONS } from "./assemblyIcons";
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { LeaderboardService } from "@/models/leaderboards/services/LeaderboardService";
import { SchoolLeaderboardEntry } from "@/models/leaderboards/interfaces/LeaderboardInterface";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";

interface SchoolLeaderboardSlideProps {
  schoolId: string;
  onBack: () => void;
}

const SchoolLeaderboardSlide = ({ schoolId, onBack }: SchoolLeaderboardSlideProps) => {
  const [schools, setSchools] = useState<SchoolLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const service = new LeaderboardService(createSupabaseClient());
        const data = await service.getSchoolLeaderboard(schoolId);
        setSchools(data);

        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 220,
          spread: 160,
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

  const maxProRata = schools[0]?.pro_rata_score || 1;

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
          src={ASSEMBLY_ICONS["school-leaderboard"]}
          alt=""
          width={64}
          height={64}
          className="mx-auto mb-3"
        />
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white">
          Interschool Leaderboard
        </h2>
        <p className="mt-1 text-sm uppercase tracking-wider" style={{ color: "#DB4FDB" }}>
          Ranked by pro-rata score
        </p>
      </div>

      {loading ? (
        <p className="animate-pulse text-white/50">Loading...</p>
      ) : (
        <div className="w-full max-w-3xl">
          <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            {schools.map((school, i) => {
              const isCurrentSchool = school.id === schoolId;
              return (
                <m.div
                  key={school.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className={`flex items-center gap-4 px-6 py-4 ${i < schools.length - 1 ? "border-b border-white/5" : ""} ${isCurrentSchool ? "bg-white/10" : ""}`}
                >
                  <span
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${isCurrentSchool ? "bg-brand-magenta-bright/20 text-brand-pink" : "bg-white/10 text-white/70"}`}
                  >
                    {school.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-bold ${isCurrentSchool ? "text-brand-pink" : "text-white"}`}
                    >
                      {school.name}
                      {isCurrentSchool && (
                        <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-brand-pink/70">
                          Your School
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-white/40">
                      {school.roll_number
                        ? `${school.roll_number.toLocaleString()} on roll · `
                        : ""}
                      {school.total_students.toLocaleString()} registered ·{" "}
                      {school.total_points.toLocaleString()} total pts
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xl font-extrabold ${isCurrentSchool ? "text-brand-pink" : "text-white"}`}
                    >
                      {school.pro_rata_score.toFixed(1)}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-white/40">Pro-Rata</p>
                  </div>
                  <div className="ml-2 hidden h-2 w-24 rounded-full bg-white/10 sm:block">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(school.pro_rata_score / maxProRata) * 100}%`,
                        backgroundColor: isCurrentSchool ? "#e019c3" : "#7EAB9F",
                      }}
                    />
                  </div>
                </m.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolLeaderboardSlide;
