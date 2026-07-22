import { useEffect, useMemo, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Activity as ActivityIcon, Flame } from "lucide-react";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import { ALL_ACTIVITY_TYPE_LABELS } from "@/models/activities/interfaces/ActivityInterface";
import { getActivityIcon, getActivityColor } from "@/modules/activities/utils/activityIcons";
import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";

interface PulseUser {
  first_name?: string | null;
  house?: { name?: string | null; color?: string | null } | null;
}

interface SchoolPulseWallProps {
  schoolId: string;
}

const relativeTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// Photo-free replacement for the school photo feed: a live pulse of who's
// been active, coloured by house. First names only, no images, nothing to
// moderate.
const SchoolPulseWall = ({ schoolId }: SchoolPulseWallProps) => {
  const [entries, setEntries] = useState<ActivityInterface[]>([]);
  const [visibleFrom, setVisibleFrom] = useState(0);

  useEffect(() => {
    const service = new ActivityService(createSupabaseClient());
    service
      .getSchoolPulse(schoolId, 25)
      .then(setEntries)
      .catch(() => {});
  }, [schoolId]);

  // Rotate the ticker window every few seconds.
  useEffect(() => {
    if (entries.length <= 4) return;
    const id = setInterval(() => {
      setVisibleFrom((i) => (i + 1) % entries.length);
    }, 4000);
    return () => clearInterval(id);
  }, [entries.length]);

  const houseEnergy = useMemo(() => {
    const totals = new Map<string, { name: string; color: string; points: number }>();
    for (const entry of entries) {
      const user = entry.user as PulseUser | undefined;
      const houseName = user?.house?.name;
      if (!houseName) continue;
      const existing = totals.get(houseName) ?? {
        name: houseName,
        color: user?.house?.color || "#1B5E4B",
        points: 0,
      };
      existing.points += entry.final_points || entry.house_points_awarded || 0;
      totals.set(houseName, existing);
    }
    return Array.from(totals.values()).sort((a, b) => b.points - a.points);
  }, [entries]);

  if (entries.length === 0) return null;

  const visible = Array.from(
    { length: Math.min(4, entries.length) },
    (_, i) => entries[(visibleFrom + i) % entries.length],
  );

  const maxHousePoints = Math.max(1, ...houseEnergy.map((h) => h.points));

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card
        className="shadow-sm rounded-2xl border border-gray-200 overflow-hidden"
        style={{ backgroundColor: "#f9fefd" }}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-magenta opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-magenta" />
            </span>
            <span className="text-sm font-semibold text-gray-700">School Pulse</span>
            <span className="ml-auto text-xs text-gray-400">
              {entries.length} recent activities
            </span>
          </div>

          {houseEnergy.length > 0 && (
            <div className="mb-4 space-y-1.5">
              {houseEnergy.map((house) => (
                <div key={house.name} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 w-20 truncate">
                    {house.name}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <m.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: house.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(house.points / maxHousePoints) * 100}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 20 }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500 w-10 text-right">
                    {house.points}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((entry) => {
                const user = entry.user as PulseUser | undefined;
                const label =
                  entry.activity_type === "something_else" && entry.custom_activity_name
                    ? entry.custom_activity_name
                    : (ALL_ACTIVITY_TYPE_LABELS[entry.activity_type] ??
                      entry.activity_type.replace(/_/g, " "));
                const color = getActivityColor(entry.activity_type);
                return (
                  <m.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-3 py-2"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {getActivityIcon(entry.activity_type, 22)}
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <span className="font-semibold text-gray-800">
                        {user?.first_name || "Someone"}
                      </span>{" "}
                      <span className="text-gray-500">
                        was active — {label}, {entry.duration_minutes} min
                      </span>
                    </div>
                    {user?.house?.color && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        title={user.house.name ?? undefined}
                        style={{ backgroundColor: user.house.color }}
                      />
                    )}
                    <span className="text-xs font-bold shrink-0" style={{ color: "#19AA4B" }}>
                      +{entry.final_points || entry.house_points_awarded}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0 w-14 text-right">
                      {relativeTime(entry.created_at)}
                    </span>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
            <Flame size={12} className="text-brand-magenta" />
            Every minute logged powers your house. Keep the pulse going!
            <ActivityIcon size={12} className="ml-auto text-gray-300" />
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
};

export default SchoolPulseWall;
