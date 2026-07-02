"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { AssemblyService } from "@/models/assembly/services/AssemblyService";
import { AssemblyWinnerInterface } from "@/models/assembly/interfaces/AssemblyWinnerInterface";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";

interface WinnersGallerySlideProps {
  schoolId: string;
  onBack: () => void;
}

const WinnersGallerySlide = ({ schoolId, onBack }: WinnersGallerySlideProps) => {
  const [winners, setWinners] = useState<AssemblyWinnerInterface[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const service = new AssemblyService(createSupabaseClient());
        const data = await service.getWinnersLog(schoolId, 50);
        setWinners(data);

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
          <span className="text-3xl">&#x1F3C6;</span>
        </div>
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white">
          Winners Gallery
        </h2>
        <p className="mt-1 text-sm uppercase tracking-wider" style={{ color: "#FF6B2B" }}>
          Past spot prize winners
        </p>
      </div>

      {loading ? (
        <p className="animate-pulse text-white/50">Loading...</p>
      ) : winners.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-10 py-12 text-center backdrop-blur-sm">
          <p className="text-white/50">No winners have been drawn yet.</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {winners.map((winner, i) => (
                <m.div
                  key={winner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xl">
                    &#x1F3C6;
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">
                      {winner.user_first_name} {winner.user_last_name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {winner.house_color && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: winner.house_color }}
                        />
                      )}
                      {winner.house_name && (
                        <span className="truncate text-xs text-white/50">{winner.house_name}</span>
                      )}
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-xs text-white/30">
                    {new Date(winner.created_at).toLocaleDateString("en-NZ", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </m.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinnersGallerySlide;
