import {
  ActivityInterface,
  ACTIVITY_TYPES,
} from "@/models/activities/interfaces/ActivityInterface";

export const NZ_TIMEZONE = "Pacific/Auckland";

export const getNZDate = (isoString: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: NZ_TIMEZONE }).format(new Date(isoString));

export const getActivityDisplayName = (activity: ActivityInterface) => {
  if (activity.activity_type === "something_else" && activity.custom_activity_name) {
    return activity.custom_activity_name;
  }
  return (
    ACTIVITY_TYPES[activity.activity_type as keyof typeof ACTIVITY_TYPES] ??
    activity.activity_type.replace("_", " ")
  );
};

export const getUserInitials = (activity: ActivityInterface) => {
  if (!activity.user) return "?";
  return `${activity.user.first_name?.[0] ?? ""}${activity.user.last_name?.[0] ?? ""}`.toUpperCase();
};

export const computeGroupRejectableIds = (
  activities: ActivityInterface[],
): Map<string, string[]> => {
  const flaggedDayKeys = new Set<string>();
  for (const a of activities) {
    if (a.is_flagged) flaggedDayKeys.add(`${a.user_id}|${getNZDate(a.created_at)}`);
  }
  const byKey: Record<string, string[]> = {};
  for (const a of activities) {
    const key = `${a.user_id}|${getNZDate(a.created_at)}`;
    if (flaggedDayKeys.has(key) && !a.is_rejected) {
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(a.id);
    }
  }
  const map = new Map<string, string[]>();
  for (const a of activities) {
    const key = `${a.user_id}|${getNZDate(a.created_at)}`;
    if (flaggedDayKeys.has(key)) map.set(a.id, byKey[key] ?? []);
  }
  return map;
};
