import { Minus, Plus, Info, Camera, Loader2 } from "lucide-react";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { WizardState } from "./types";
import { ACTIVITY_TYPES } from "@/models/activities/interfaces/ActivityInterface";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { subDays } from "date-fns";
import { formatEventDate } from "@/modules/common/utils/dateUtils";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { toast } from "sonner";
import { useRef, useState } from "react";

const NZ_TIMEZONE = "Pacific/Auckland";

const getNZDateString = () => {
  const nzDate = toZonedTime(new Date(), NZ_TIMEZONE);
  return formatTz(nzDate, "yyyy-MM-dd", { timeZone: NZ_TIMEZONE });
};

const MAX_ACTIVITY_DAYS_AGO = 7;

interface Step3DateDurationProps {
  data: WizardState;
  challenges: EventInterface[];
  onChange: (updates: Partial<WizardState>) => void;
}

const Step3DateDuration = ({ data, challenges, onChange }: Step3DateDurationProps) => {
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleScanScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { extractMinutesFromScreenshot } = await import("@/lib/ai.functions");
      const result = await extractMinutesFromScreenshot({ data: { base64Image: base64 } } as any);

      // A challenge fixes the activity type — never override that.
      const challengeLocksType = Boolean(challenges.find((c) => c.id === data.eventId)?.event_type);
      const updates: Partial<WizardState> = {};
      if (result.minutes && result.minutes > 0) updates.durationMinutes = result.minutes;
      if (result.activityType && !challengeLocksType) updates.activityType = result.activityType;

      if (Object.keys(updates).length > 0) {
        onChange(updates);
        const bits: string[] = [];
        if (updates.durationMinutes) bits.push(`${updates.durationMinutes} min`);
        if (updates.activityType)
          bits.push(ACTIVITY_TYPES[updates.activityType as keyof typeof ACTIVITY_TYPES]);
        toast.success(`Detected ${bits.join(" · ")} from your screenshot`);
      } else {
        toast.error("Could not read that screenshot. Try entering the details manually.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to scan screenshot");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const selectedChallenge = challenges.find((c) => c.id === data.eventId);
  const basePoints = data.durationMinutes;
  const pointsDisplay = (() => {
    if (selectedChallenge?.challenge_points) return selectedChallenge.challenge_points;
    if (selectedChallenge?.points_multiplier && selectedChallenge.points_multiplier > 1) {
      return Math.round(basePoints * selectedChallenge.points_multiplier);
    }
    return basePoints;
  })();

  const sevenDaysAgo = formatTz(
    toZonedTime(subDays(new Date(), MAX_ACTIVITY_DAYS_AGO), NZ_TIMEZONE),
    "yyyy-MM-dd",
    { timeZone: NZ_TIMEZONE },
  );

  const minDate =
    selectedChallenge?.start_date && selectedChallenge.start_date > sevenDaysAgo
      ? selectedChallenge.start_date
      : sevenDaysAgo;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1B5E4B] mb-1">When and how long?</h2>
        <p className="text-gray-500 text-sm font-accent">
          Tell us when you did this activity and for how long.
        </p>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">When did you do this?</label>
        <input
          type="date"
          value={data.activityDate}
          min={minDate}
          max={getNZDateString()}
          onChange={(e) => onChange({ activityDate: e.target.value })}
          className="w-full py-3 px-4 bg-[#1B5E4B]/5 text-gray-900 border border-gray-200 rounded-xl focus:border-[#cf04d2] focus:outline-none transition-colors"
        />
        {selectedChallenge && selectedChallenge.start_date > sevenDaysAgo && (
          <p className="text-xs" style={{ color: "#62988a" }}>
            Activities for this challenge can only be logged from{" "}
            {formatEventDate(selectedChallenge.start_date, "d MMM")} onwards.
          </p>
        )}
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">How many minutes?</label>
        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange({ durationMinutes: Math.max(0, data.durationMinutes - 1) })}
            disabled={data.durationMinutes <= 0}
            className="shrink-0 w-14 h-14 p-0 rounded-xl border-2 text-xl font-bold text-[#1B5E4B] border-gray-200"
          >
            <Minus size={18} />
          </Button>
          <input
            type="number"
            value={data.durationMinutes || ""}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onChange({ durationMinutes: isNaN(val) ? 0 : Math.max(0, val) });
            }}
            placeholder="0"
            min="0"
            className="min-w-0 flex-1 text-center text-4xl font-black py-3 px-2 bg-[#1B5E4B]/5 text-gray-900 border border-gray-200 rounded-xl focus:border-[#cf04d2] focus:outline-none transition-colors"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange({ durationMinutes: data.durationMinutes + 1 })}
            className="shrink-0 w-14 h-14 p-0 rounded-xl border-2 text-xl font-bold text-[#1B5E4B] border-gray-200"
          >
            <Plus size={18} />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="gap-1.5 text-xs border-dashed"
          >
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {scanning ? "Scanning…" : "Scan a workout screenshot"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleScanScreenshot}
          />
          <span className="text-xs text-gray-400">Auto-fills your minutes and activity type</span>
        </div>
      </div>

      {/* Points preview */}
      {data.durationMinutes > 0 && (
        <div className="flex items-start gap-2 p-3 bg-[#1B5E4B]/5 border border-[#1B5E4B]/20 rounded-xl">
          <Info size={16} className="text-[#1B5E4B] mt-0.5 shrink-0" />
          <div className="text-sm text-[#1B5E4B]">
            {selectedChallenge?.challenge_points ? (
              <span>
                You&apos;ll earn <strong>{pointsDisplay} points</strong> as a fixed challenge reward
                — nice mahi!
              </span>
            ) : selectedChallenge?.points_multiplier && selectedChallenge.points_multiplier > 1 ? (
              <span>
                You&apos;ll earn <strong>{pointsDisplay} points</strong> with the{" "}
                {selectedChallenge.points_multiplier}× challenge bonus — nice mahi!
              </span>
            ) : (
              <span>
                You&apos;ll earn <strong>{pointsDisplay} points</strong> — nice mahi!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3DateDuration;
