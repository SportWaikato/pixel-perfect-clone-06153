import {
  ACTIVITY_TYPES,
  ALL_ACTIVITY_TYPE_LABELS,
} from "@/models/activities/interfaces/ActivityInterface";
import {
  getActivityIcon,
  getActivityColor,
} from "@/modules/activities/utils/activityIcons";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { WizardState, EVENT_TYPE_TO_ACTIVITY_TYPE } from "./types";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Zap, Users, User, Trophy } from "lucide-react";
import { format } from "date-fns";
import { m } from "framer-motion";
import { squishyTap } from "@/modules/application/components/animations/tactile";

const CONTEXT_LABELS: Record<string, { label: string; icon: typeof Zap }> = {
  training: { label: "Training / Practice", icon: Zap },
  casual: { label: "For Fun", icon: User },
  competition: { label: "Competition", icon: Trophy },
};

interface Step5ConfirmProps {
  data: WizardState;
  challenges: EventInterface[];
  user: UserInterface;
  isSubmitting: boolean;
  onSubmit: () => void;
  onUpdate: (updates: Partial<WizardState>) => void;
}

const Step5Confirm = ({
  data,
  challenges,
  user,
  isSubmitting,
  onSubmit,
  onUpdate,
}: Step5ConfirmProps) => {
  const selectedChallenge = challenges.find((c) => c.id === data.eventId);
  const lockedType = selectedChallenge
    ? EVENT_TYPE_TO_ACTIVITY_TYPE[selectedChallenge.event_type]
    : null;
  const displayType = lockedType || data.activityType;
  const displayName =
    data.activityType === "something_else" && data.customActivityName
      ? data.customActivityName
      : (ALL_ACTIVITY_TYPE_LABELS[displayType as keyof typeof ACTIVITY_TYPES] ?? displayType);

  const basePoints = data.durationMinutes;
  const pointsEarned = (() => {
    if (selectedChallenge?.challenge_points) return selectedChallenge.challenge_points;
    if (selectedChallenge?.points_multiplier && selectedChallenge.points_multiplier > 1) {
      return Math.round(basePoints * selectedChallenge.points_multiplier);
    }
    return basePoints;
  })();

  const iconColor = getActivityColor(displayType);
  const ctx = CONTEXT_LABELS[data.activityContext];
  const CtxIcon = ctx?.icon || Zap;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1B5E4B] mb-1">Confirm and log it</h2>
        <p className="text-gray-500 text-sm font-accent">
          Everything look good? Hit &quot;Log it&quot; to record your activity.
        </p>
      </div>

      {/* Summary card */}
      <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
          >
            {getActivityIcon(displayType, 38)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 truncate">{displayName}</p>
            <p className="text-sm text-gray-500">
              {data.durationMinutes} min
              {data.activityDate &&
                ` · ${format(new Date(`${data.activityDate}T12:00:00`), "MMM d, yyyy")}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <CtxIcon size={14} />
            <span>{ctx?.label || data.activityContext}</span>
          </div>
          {data.activityContext === "competition" && data.competitionName && (
            <span className="text-xs text-gray-400">· {data.competitionName}</span>
          )}
          <span className="mx-1 text-gray-300">|</span>
          {data.participationType === "with_others" ? (
            <>
              <Users size={14} /> With others
            </>
          ) : (
            <>
              <User size={14} /> Solo
            </>
          )}
          {selectedChallenge && (
            <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              {selectedChallenge.name}
            </span>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="text-center py-2">
        <div className="text-5xl font-black" style={{ color: "#19AA4B" }}>
          +{pointsEarned}
        </div>
        <p className="text-gray-500 text-sm mt-1 font-accent text-lg">points earned</p>
        {user.house_id && (
          <p className="text-xs text-gray-400 mt-0.5">Contributing to your house</p>
        )}
      </div>

      <m.div {...squishyTap}>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-4 text-base font-bold rounded-2xl gap-2"
          style={{ backgroundColor: "#1B5E4B", color: "white" }}
        >
          <Zap size={18} />
          {isSubmitting ? "Logging…" : "Log it"}
        </Button>
      </m.div>
    </div>
  );
};

export default Step5Confirm;
