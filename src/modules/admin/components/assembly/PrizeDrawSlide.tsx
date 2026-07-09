import { useCallback, useEffect, useRef, useState } from "react";
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

const PrizeDrawSlide = ({ schoolId, drawnByUserId, students, onBack }: PrizeDrawSlideProps) => {
  const [state, setState] = useState<DrawState>("ready");
  const [displayName, setDisplayName] = useState("");
  const [winner, setWinner] = useState<UserInterface | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const eligibleStudents = students.filter(
    (s) =>
      s.is_active !== false &&
      s.role === "student" &&
      s.last_activity_date != null &&
      new Date(s.last_activity_date) >= sevenDaysAgo,
  );

  const clearSpin = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearSpin(), [clearSpin]);

  const handleDraw = useCallback(async () => {
    if (eligibleStudents.length === 0) return;
    setState("spinning");

    const picked = eligibleStudents[Math.floor(Math.random() * eligibleStudents.length)];
    let tick = 0;
    const totalTicks = 30;

    intervalRef.current = setInterval(() => {
      const random = eligibleStudents[Math.floor(Math.random() * eligibleStudents.length)];
      setDisplayName(`${random.first_name} ${random.last_name}`);
      tick++;

      if (tick >= totalTicks) {
        clearSpin();
        setWinner(picked);
        setDisplayName(`${picked.first_name} ${picked.last_name}`);
        setState("winner");

        (async () => {
          try {
            const confetti = (await import("canvas-confetti")).default;
            confetti({
              particleCount: 250,
              spread: 180,
              origin: { y: 0.5 },
              colors: ["#FFD700", "#F6C031", "#ffffff", "#00ACEF"],
            });

            const service = new AssemblyService(createSupabaseClient());
            await service.saveWinner({
              school_id: schoolId,
              drawn_by: drawnByUserId,
              user_id: picked.id,
              user_first_name: picked.first_name,
              user_last_name: picked.last_name,
              user_username: picked.username,
              house_name: (picked as any).house?.name || null,
              house_color: (picked as any).house?.color || null,
            });
          } catch (err) {
            notifyAboutError(err);
          }
        })();
      }
    }, 80);
  }, [eligibleStudents, schoolId, drawnByUserId, clearSpin]);

  const handleDrawAgain = () => {
    setWinner(null);
    setDisplayName("");
    setState("ready");
  };

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
          src="/assembly/icon-prize-draw.png"
          alt=""
          width={64}
          height={64}
          className="mx-auto mb-3"
        />
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white">
          Spot Prize Draw
        </h2>
      </div>

      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-10 py-12 text-center backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {state === "ready" && (
              <m.div
                key="ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <img
                  src="/assembly/icon-ready-to-draw.png"
                  alt=""
                  width={80}
                  height={80}
                  className="mx-auto"
                />
                <p className="text-xl font-semibold text-white">Ready to draw the winner?</p>
                <p className="text-sm text-white/40">
                  {eligibleStudents.length === 0
                    ? "No eligible students found. Make sure students have logged activity in the last 7 days."
                    : `${eligibleStudents.length} active student${eligibleStudents.length === 1 ? "" : "s"} in the pool`}
                </p>
                <button
                  onClick={handleDraw}
                  disabled={eligibleStudents.length === 0}
                  className="rounded-xl bg-white px-8 py-3 font-bold transition-colors hover:bg-white/90 disabled:opacity-40"
                  style={{ color: "#357565" }}
                >
                  Draw Winner Now
                </button>
              </m.div>
            )}

            {state === "spinning" && (
              <m.div
                key="spinning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="text-6xl animate-bounce">🎲</div>
                <p className="text-2xl font-extrabold text-white min-h-[2rem]">{displayName}</p>
              </m.div>
            )}

            {state === "winner" && winner && (
              <m.div
                key="winner"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="space-y-4"
              >
                <m.div
                  className="relative mx-auto h-20 w-20"
                  animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-amber-500/20 text-5xl">
                    🏆
                  </div>
                  {[...Array(3)].map((_, i) => (
                    <m.div
                      key={i}
                      className="absolute inset-0 rounded-full border-2 border-amber-400/40"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 2.5 + i * 0.6, opacity: 0 }}
                      transition={{
                        duration: 1.2,
                        delay: i * 0.2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  ))}
                </m.div>

                <div>
                  <p className="text-3xl font-extrabold text-white">{displayName}</p>
                  <p className="mt-1 text-lg font-bold text-amber-400">Congratulations!</p>
                </div>

                <button
                  onClick={handleDrawAgain}
                  className="mt-4 rounded-xl bg-white px-8 py-3 font-bold transition-colors hover:bg-white/90"
                  style={{ color: "#357565" }}
                >
                  Draw Again
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PrizeDrawSlide;
