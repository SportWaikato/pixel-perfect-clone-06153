// React hook the UI uses to talk to whatever HealthProvider is active.
//
// On the web build this settles to `available: false, reason: "web"` and
// `connect()` is a no-op that surfaces that reason — enough to drive an honest
// "coming soon" card today. Once a native provider exists, the SAME hook
// exposes a real permission prompt + workout pull with no changes at the call
// site.

import { useCallback, useEffect, useState } from "react";
import type { HealthAvailability, HealthPermissionStatus, HealthWorkoutSample } from "./types";
import { getHealthProvider } from "./providers";
import { mapPlatformActivityType } from "./activityTypeMap";

interface UseWearableSync {
  /** Null while the first availability check is in flight. */
  availability: HealthAvailability | null;
  permission: HealthPermissionStatus;
  /** True while a permission request or workout pull is running. */
  busy: boolean;
  /** Trigger the OS permission sheet (no-op on web). */
  connect: () => Promise<HealthPermissionStatus>;
  /** Pull workouts since `since`, activity types already mapped. */
  pullWorkouts: (since: Date) => Promise<HealthWorkoutSample[]>;
}

export const useWearableSync = (): UseWearableSync => {
  const [availability, setAvailability] = useState<HealthAvailability | null>(null);
  const [permission, setPermission] = useState<HealthPermissionStatus>("unknown");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHealthProvider()
      .checkAvailability()
      .then((a) => {
        if (!cancelled) setAvailability(a);
      })
      .catch(() => {
        if (!cancelled) setAvailability({ available: false, platform: "none", reason: "web" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setBusy(true);
    try {
      const status = await getHealthProvider().requestPermissions();
      setPermission(status);
      return status;
    } finally {
      setBusy(false);
    }
  }, []);

  const pullWorkouts = useCallback(async (since: Date) => {
    setBusy(true);
    try {
      const workouts = await getHealthProvider().getWorkouts(since);
      // Ensure activity types are mapped even if a provider forgot to.
      return workouts.map((w) => ({
        ...w,
        activityType: w.activityType ?? mapPlatformActivityType(w.sourceActivityType),
      }));
    } finally {
      setBusy(false);
    }
  }, []);

  return { availability, permission, busy, connect, pullWorkouts };
};
