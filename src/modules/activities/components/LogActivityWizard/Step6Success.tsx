import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Flame, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import { squishyTap } from "@/modules/application/components/animations/tactile";

interface Step6SuccessProps {
  user: UserInterface;
  pointsEarned: number;
  onLogAnother: () => void;
}

const Step6Success = ({ user, pointsEarned, onLogAnother }: Step6SuccessProps) => {
  const firstName = user.first_name || "there";
  const currentStreak = user.current_streak || 0;

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      <m.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="text-7xl select-none">🏆</div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h2 className="text-2xl font-black text-[#1B5E4B]">Activity logged!</h2>
        <p className="text-2xl text-gray-700 mt-1 font-accent">Ka pai, {firstName}!</p>
      </m.div>

      <m.div
        className="w-full p-6 bg-[#1B5E4B]/5 border border-[#1B5E4B]/15 rounded-2xl space-y-3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 20 }}
      >
        <m.div
          className="text-6xl font-black tracking-tight"
          style={{ color: "#19AA4B" }}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 18 }}
        >
          +{pointsEarned}
        </m.div>
        <p className="text-gray-500 text-sm font-accent text-lg">points earned</p>

        {currentStreak > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-orange-600">
            <Flame size={16} />
            Day {currentStreak} streak — keep it up!
          </div>
        )}
      </m.div>

      <m.div
        className="w-full space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <m.div {...squishyTap}>
          <Button
            onClick={onLogAnother}
            className="w-full gap-2 py-3 rounded-2xl font-bold"
            style={{ backgroundColor: "#1B5E4B", color: "white" }}
          >
            <Plus size={16} />
            Log another activity
          </Button>
        </m.div>
        <Button variant="outline" className="w-full py-3 rounded-2xl font-medium border-2" asChild>
          <Link to="/activities">View your activity log</Link>
        </Button>
      </m.div>
    </div>
  );
};

export default Step6Success;
