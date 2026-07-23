import { useRef, useState, useMemo } from "react";
import { ACTIVITY_TYPES } from "@/models/activities/interfaces/ActivityInterface";
import { getActivityIcon, getActivityColor } from "@/modules/activities/utils/activityIcons";
import { WizardState, EVENT_TYPE_TO_ACTIVITY_TYPE } from "./types";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { Input } from "@/modules/application/components/DesignSystem/ui/input";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { m } from "framer-motion";
import { squishyTap } from "@/modules/application/components/animations/tactile";
import { Camera, Loader2, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";

interface Step2ActivityTypeProps {
  data: WizardState;
  challenges: EventInterface[];
  onChange: (updates: Partial<WizardState>) => void;
  recentTypes?: string[];
}

const Step2ActivityType = ({ data, challenges, onChange, recentTypes = [] }: Step2ActivityTypeProps) => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<{ activity_type: string; duration_minutes: number } | null>(null);
  const [searchText, setSearchText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedChallenge = challenges.find((c) => c.id === data.eventId);
  const lockedType = selectedChallenge
    ? EVENT_TYPE_TO_ACTIVITY_TYPE[selectedChallenge.event_type]
    : null;

  const popularTypes = useMemo(() => {
    if (recentTypes.length > 0) return recentTypes;
    return ["run_jog", "bike_cycle", "walk_hike", "swimming"];
  }, [recentTypes]);

  const allActivityTypes = useMemo(() => {
    const entries = Object.entries(ACTIVITY_TYPES).filter(([key]) => key !== "survey_completion");
    const somethingElse = entries.find(([key]) => key === "something_else");
    const others = entries.filter(([key]) => key !== "something_else");
    return somethingElse ? [...others, somethingElse] : others;
  }, []);

  const filteredTypes = useMemo(() => {
    if (!searchText.trim()) return [] as [string, string][];
    const search = searchText.toLowerCase();
    const results = Object.entries(ACTIVITY_TYPES).filter(([key, label]) => {
      if (key === "survey_completion") return false;
      return label.toLowerCase().includes(search) || key.toLowerCase().includes(search);
    });
    const somethingElse = results.find(([key]) => key === "something_else");
    const others = results.filter(([key]) => key !== "something_else");
    return somethingElse ? [...others, somethingElse] : others;
  }, [searchText]);

  const handleSelect = (type: string) => {
    if (lockedType) return;
    onChange({
      activityType: type,
      customActivityName: type !== "something_else" ? "" : data.customActivityName,
    });
    setSearchText("");
  };

  const handleScanScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { scanWorkoutScreenshot } = await import("@/lib/ai.functions");
      const result: any = await scanWorkoutScreenshot({ data: { base64Image: base64 } });

      if (result.activity_type && result.duration_minutes) {
        setScannedData(result);
        onChange({
          activityType: result.activity_type,
          durationMinutes: result.duration_minutes,
        });
        toast.success(
          `Detected ${ACTIVITY_TYPES[result.activity_type as keyof typeof ACTIVITY_TYPES] || result.activity_type} · ${result.duration_minutes} min`,
        );
      } else if (result.duration_minutes) {
        onChange({ durationMinutes: result.duration_minutes });
        toast.success(`Detected ${result.duration_minutes} minutes`);
      } else {
        toast.error("Could not read activity from screenshot. Select manually below.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to scan screenshot");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const renderActivityButton = (type: string, label: string, idx?: number) => {
    const isSelected = data.activityType === type;
    const color = getActivityColor(type);
    return (
      <m.button
        key={type}
        type="button"
        onClick={() => handleSelect(type)}
        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 ${
          isSelected
            ? "border-[#cf04d2] bg-[#1B5E4B]/5 shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
        {...squishyTap}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {getActivityIcon(type, 38)}
        </div>
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </m.button>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-[#1B5E4B] mb-1">What did you do?</h2>
        <p className="text-gray-500 text-sm font-accent">
          Choose your activity or scan a workout screenshot.
        </p>
      </div>

      {/* Screenshot Scanner */}
      {!lockedType && (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 space-y-3 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-[#1B5E4B]" />
              <span className="text-sm font-semibold text-gray-700">Have a workout screenshot?</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
              className="gap-1.5 text-xs"
            >
              {scanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {scanning ? "Scanning..." : "Scan Screenshot"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleScanScreenshot}
            />
          </div>

          {scannedData && (
            <m.div
              className="flex items-center gap-3 bg-[#1B5E4B]/5 rounded-xl p-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <CheckCircle2 size={18} className="text-green-600" />
              <div>
                <p className="text-sm font-semibold text-[#1B5E4B]">
                  {ACTIVITY_TYPES[scannedData.activity_type as keyof typeof ACTIVITY_TYPES] || scannedData.activity_type}
                </p>
                <p className="text-xs text-gray-500">{scannedData.duration_minutes} minutes detected</p>
              </div>
            </m.div>
          )}

          <p className="text-xs text-gray-400">
            Upload a Strava, Apple Watch, or Garmin screenshot to auto-fill activity type and duration.
          </p>
        </div>
      )}

      {lockedType ? (
        <div className="p-4 rounded-2xl border border-[#cf04d2] bg-white">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#1B5E4B]/10"
              style={{ color: "#1B5E4B" }}
            >
              {getActivityIcon(lockedType, 38)}
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {ACTIVITY_TYPES[lockedType as keyof typeof ACTIVITY_TYPES]}
              </p>
              <p className="text-xs text-gray-500">Activity type set by challenge</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search box */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search activities or select from your favourites below..."
              className="pl-9 rounded-xl border-2 border-gray-200 focus:border-[#1B5E4B]/40"
            />
          </div>

          {/* Search results — inline block list (not absolute) */}
          {searchText.trim() && filteredTypes.length > 0 && (
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm max-h-52 overflow-y-auto divide-y divide-gray-100">
              {filteredTypes.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    handleSelect(key);
                    setSearchText("");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left${data.activityType === key ? " bg-[#1B5E4B]/5" : ""}`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${getActivityColor(key)}18` }}
                  >
                    {getActivityIcon(key, 20)}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                </button>
              ))}
            </div>
          )}

          {searchText.trim() && filteredTypes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">No activities match &quot;{searchText}&quot;</p>
          )}

          {/* Top 4 favourites — always visible when NOT searching */}
          {!searchText.trim() && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {recentTypes.length > 0 ? "Your Favourites" : "Popular"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {popularTypes.map((type) => {
                  const label = ACTIVITY_TYPES[type as keyof typeof ACTIVITY_TYPES] || type;
                  return renderActivityButton(type, label);
                })}
              </div>
            </>
          )}

          {/* "Something else" custom input */}
          {data.activityType === "something_else" && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                What activity did you do?
              </label>
              <Input
                value={data.customActivityName}
                onChange={(e) => onChange({ customActivityName: e.target.value })}
                placeholder="Describe your activity"
                className="rounded-xl border"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Step2ActivityType;
