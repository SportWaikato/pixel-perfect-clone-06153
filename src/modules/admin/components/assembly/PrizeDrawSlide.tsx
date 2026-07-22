import { ASSEMBLY_ICONS } from "./assemblyIcons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { AssemblyService } from "@/models/assembly/services/AssemblyService";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";

interface PrizeDrawSlideProps {
  schoolId: string;
  drawnByUserId: string;
  students: UserInterface[];
  onBack: () => void;
}

type DrawState = "ready" | "spinning" | "winner";

// Name-board geometry (a raffle-style name draw, NOT a slot machine — no
// gambling iconography, just names scrolling to a highlighted winner). Large
// for projector legibility. VISIBLE must be odd so one row sits dead-centre.
const ROW = 84;
const VISIBLE = 5;
const CENTER_OFFSET = ((VISIBLE - 1) / 2) * ROW;
const NAME_COUNT = 52; // names that scroll past before landing
const WINNER_INDEX = NAME_COUNT - 5; // leave a few rows below so neighbours show at rest

type Row = { key: string; label: string };

const PrizeDrawSlide = ({ schoolId, drawnByUserId, students, onBack }: PrizeDrawSlideProps) => {
  const [state, setState] = useState<DrawState>("ready");
  const [winner, setWinner] = useState<UserInterface | null>(null);
  const [names, setNames] = useState<Row[]>([]);

  const eligibleStudents = useMemo(
    () => students.filter((s) => s.is_active !== false && s.role === "student"),
    [students],
  );

  const nameOf = (s: UserInterface) => `${s.first_name} ${s.last_name}`;

  const finalY = CENTER_OFFSET - WINNER_INDEX * ROW;
  // Start a few rows "back" so there is always travel even with tiny pools.
  const startY = CENTER_OFFSET;

  const saveAndCelebrate = useCallback(
    async (picked: UserInterface) => {
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 250,
          spread: 180,
          origin: { y: 0.5 },
          colors: ["#FFD700", "#F6C031", "#ffffff", "#00ACEF", "#E019C3"],
        });

        const service = new AssemblyService(createSupabaseClient());
        await service.saveWinner({
          school_id: schoolId,
          drawn_by: drawnByUserId,
          user_id: picked.id,
          user_first_name: picked.first_name,
          user_last_name: picked.last_name,
          user_username: picked.username,
          house_name: (picked as unknown as { house?: { name?: string } }).house?.name || null,
          house_color: (picked as unknown as { house?: { color?: string } }).house?.color || null,
        });
      } catch (err) {
        notifyAboutError(err);
      }
    },
    [schoolId, drawnByUserId],
  );

  const handleDraw = useCallback(() => {
    if (eligibleStudents.length === 0) return;

    // Fairness/RNG unchanged: uniform random pick from the eligible pool.
    const picked = eligibleStudents[Math.floor(Math.random() * eligibleStudents.length)];

    // Build the scrolling name list: random filler sampled from the pool, with
    // the winner planted at WINNER_INDEX. Works identically for 20 or 200+ students.
    const rows: Row[] = [];
    for (let i = 0; i < NAME_COUNT; i++) {
      if (i === WINNER_INDEX) {
        rows.push({ key: `w-${i}`, label: nameOf(picked) });
      } else {
        const rnd = eligibleStudents[Math.floor(Math.random() * eligibleStudents.length)];
        rows.push({ key: `${rnd.id}-${i}`, label: nameOf(rnd) });
      }
    }

    setWinner(picked);
    setNames(rows);
    setState("spinning");
  }, [eligibleStudents]);

  const handleDrawAgain = () => {
    setWinner(null);
    setNames([]);
    setState("ready");
  };

  const onDrawSettled = useCallback(() => {
    if (state !== "spinning" || !winner) return;
    setState("winner");
    void saveAndCelebrate(winner);
  }, [state, winner, saveAndCelebrate]);

  useEffect(() => {
    // Keyboard: Enter/Space to draw from the back of the hall via a clicker.
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && state === "ready") handleDraw();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, handleDraw]);

  const showDraw = state === "spinning" || state === "winner";

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
          src={ASSEMBLY_ICONS["prize-draw"]}
          alt=""
          width={64}
          height={64}
          className="mx-auto mb-3"
        />
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white">
          Spot Prize Draw
        </h2>
      </div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {state === "ready" && (
            <m.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 rounded-2xl border border-white/10 bg-white/5 px-10 py-12 text-center backdrop-blur-sm"
            >
              <img
                src="/assembly/read-to-draw.svg"
                alt=""
                width={80}
                height={80}
                className="mx-auto"
              />
              <p className="text-xl font-semibold text-white">Ready to draw the winner?</p>
              <p className="text-sm text-white/40">
                {eligibleStudents.length === 0
                  ? "No eligible students found. Make sure students are registered to this school."
                  : `${eligibleStudents.length} eligible student${eligibleStudents.length === 1 ? "" : "s"} in the pool`}
              </p>
              <button
                onClick={handleDraw}
                disabled={eligibleStudents.length === 0}
                className="rounded-xl bg-white px-8 py-3 text-lg font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{ color: "#357565" }}
              >
                Draw Winner Now
              </button>
            </m.div>
          )}

          {showDraw && (
            <m.div
              key="draw"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Name-draw board — names scroll and decelerate to the winner */}
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
                style={{ height: VISIBLE * ROW }}
              >
                {/* fade top/bottom */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-[#0C4036] to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-[#0C4036] to-transparent" />

                {/* centre highlight band + pointer */}
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 border-y-2 border-brand-pink/70 bg-brand-magenta-bright/10"
                  style={{ top: CENTER_OFFSET, height: ROW }}
                />
                <div
                  className="pointer-events-none absolute right-2 z-30 h-0 w-0 border-y-[12px] border-r-[16px] border-y-transparent border-r-brand-pink"
                  style={{ top: CENTER_OFFSET + ROW / 2 - 12 }}
                />

                <m.div
                  initial={{ y: startY }}
                  animate={{ y: state === "winner" ? finalY : finalY }}
                  transition={
                    state === "winner"
                      ? { duration: 0 }
                      : { duration: 3.4, ease: [0.12, 0.7, 0.2, 1] }
                  }
                  onAnimationComplete={onDrawSettled}
                >
                  {names.map((row, i) => {
                    const isWinnerRow = state === "winner" && i === WINNER_INDEX;
                    return (
                      <div
                        key={row.key}
                        className="flex items-center justify-center px-6 text-center"
                        style={{ height: ROW }}
                      >
                        <span
                          className={
                            isWinnerRow
                              ? "text-4xl font-black text-brand-pink drop-shadow"
                              : "text-3xl font-bold text-white/85"
                          }
                        >
                          {row.label}
                        </span>
                      </div>
                    );
                  })}
                </m.div>
              </div>

              {/* Winner reveal */}
              <AnimatePresence>
                {state === "winner" && winner && (
                  <m.div
                    key="win"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <m.div
                      className="text-5xl"
                      animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                      transition={{ duration: 0.6 }}
                    >
                      🏆
                    </m.div>
                    <p className="text-lg font-bold text-brand-pink">
                      {(winner as unknown as { house?: { name?: string } }).house?.name
                        ? `${(winner as unknown as { house?: { name?: string } }).house?.name} — Congratulations!`
                        : "Congratulations!"}
                    </p>
                    <button
                      onClick={handleDrawAgain}
                      className="mt-1 rounded-xl bg-white px-8 py-3 font-bold transition-transform hover:scale-105 active:scale-95"
                      style={{ color: "#357565" }}
                    >
                      Draw Again
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PrizeDrawSlide;
