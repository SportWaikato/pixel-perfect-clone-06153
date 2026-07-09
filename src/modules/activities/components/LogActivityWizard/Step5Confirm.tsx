import { useState, useRef } from "react";
import {
  ACTIVITY_TYPES,
  ALL_ACTIVITY_TYPE_LABELS,
} from "@/models/activities/interfaces/ActivityInterface";
import {
  getActivityIcon,
  getActivityColor,
  getFeelingEmoji,
} from "@/modules/activities/utils/activityIcons";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { WizardState, EVENT_TYPE_TO_ACTIVITY_TYPE } from "./types";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Zap, Users, User, Camera, X } from "lucide-react";
import { format } from "date-fns";
import { m } from "framer-motion";
import { squishyTap } from "@/modules/application/components/animations/tactile";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ proofImageFile: file as unknown as WizardState["proofImageFile"] });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    onUpdate({ proofImageFile: null });
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
          {data.feeling && <span className="text-2xl">{getFeelingEmoji(data.feeling)}</span>}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
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

      {/* Proof photo (optional) */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Proof (optional)</p>
        <p className="text-xs text-gray-400">
          Attach a screenshot or photo for context -- Strava, gym machine, team practice.
        </p>
        {previewUrl ? (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Proof preview"
              className="w-24 h-24 object-cover rounded-xl border border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1B5E4B] font-medium hover:underline">
            <Camera size={16} />
            Add proof photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        )}
      </div>

      {previewUrl && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.shareToFeed}
            onChange={(e) => onUpdate({ shareToFeed: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-[#D103D1] focus:ring-[#D103D1]"
          />
          <span className="text-sm text-gray-600">
            Share to school feed (requires admin approval)
          </span>
        </label>
      )}

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
