import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Flame, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface Step6SuccessProps {
  user: UserInterface;
  pointsEarned: number;
  onLogAnother: () => void;
}

/** rAF count-up so the points number rolls in rather than appearing. */
const useCountUp = (target: number, durationMs = 900) => {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / durationMs, 1);
      // easeOutCubic
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
};

const spring = { type: "spring", stiffness: 260, damping: 18 } as const;

const Step6Success = ({ user, pointsEarned, onLogAnother }: Step6SuccessProps) => {
  const firstName = user.first_name || "there";
  const currentStreak = user.current_streak || 0;
  const shownPoints = useCountUp(pointsEarned);

  useEffect(() => {
    // Celebration burst — fire and forget.
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 120,
        spread: 90,
        startVelocity: 38,
        origin: { y: 0.6 },
        colors: ["#1B5E4B", "#118061", "#E019C3", "#DB4FDB", "#F6C031"],
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      {/* Trophy pops in with a wiggle */}
      <m.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={spring}
        className="text-6xl select-none"
      >
        🏆
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-h2 font-display text-brand-green">Activity logged!</h2>
        <p className="font-accent text-3xl text-brand-magenta mt-1">Ka pai, {firstName}!</p>
      </m.div>

      {/* Points roll up */}
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...spring, delay: 0.15 }}
        className="w-full p-5 bg-brand-green/5 border border-brand-green/15 rounded-2xl space-y-3"
      >
        <div className="text-display font-display" style={{ color: "#19AA4B" }}>
          +{shownPoints}
        </div>
        <p className="text-gray-500 text-body-sm">points earned</p>

        {currentStreak > 0 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-orange-600"
          >
            <m.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 1.2 }}
              className="flex"
            >
              <Flame size={16} />
            </m.span>
            Day {currentStreak} streak — keep it up!
          </m.div>
        )}
      </m.div>

      {/* Actions */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full space-y-3"
      >
        <Button
          onClick={onLogAnother}
          className="w-full gap-2 py-3 rounded-2xl font-bold"
          style={{ backgroundColor: "var(--brand-primary-green)", color: "white" }}
        >
          <Plus size={16} />
          Log another activity
        </Button>
        <Button variant="outline" className="w-full py-3 rounded-2xl font-medium border-2" asChild>
          <Link to="/activities">View your activity log</Link>
        </Button>
      </m.div>
    </div>
  );
};

export default Step6Success;
