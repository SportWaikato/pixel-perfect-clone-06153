// Bridge to the native shell's health plugin.
//
// The native app (Capacitor wrapper) loads this same web build in a webview
// and registers a plugin named "KarawhiuaHealth" implementing three methods
// that mirror HealthProvider. This file feature-detects that bridge at
// runtime — in a plain browser it simply reports unavailable, so shipping it
// costs nothing today and makes the native app work with zero web changes.
//
// Expected plugin surface (implemented natively over HealthKit on iOS and
// Health Connect on Android):
//   checkAvailability(): { available: boolean; platform: string; reason?: string }
//   requestPermissions(): { status: "granted" | "denied" }
//   getWorkouts({ sinceIso }): { workouts: Array<{ externalId, sourceActivityType,
//     startedAt, endedAt, durationMinutes, distanceKm?, activeEnergyKcal? }> }

import type {
  HealthProvider,
  HealthAvailability,
  HealthPermissionStatus,
  HealthWorkoutSample,
  HealthPlatform,
  UnavailableReason,
} from "../types";
import { mapPlatformActivityType } from "../activityTypeMap";

interface NativeHealthPlugin {
  checkAvailability(): Promise<{ available: boolean; platform?: string; reason?: string }>;
  requestPermissions(): Promise<{ status: string }>;
  getWorkouts(options: { sinceIso: string }): Promise<{
    workouts: Array<{
      externalId: string;
      sourceActivityType: string;
      startedAt: string;
      endedAt: string;
      durationMinutes: number;
      distanceKm?: number;
      activeEnergyKcal?: number;
    }>;
  }>;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: Record<string, unknown>;
}

const getBridge = (): NativeHealthPlugin | null => {
  if (typeof window === "undefined") return null;
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  const plugin = cap.Plugins?.KarawhiuaHealth as NativeHealthPlugin | undefined;
  return plugin ?? null;
};

/** True when running inside the native shell with the health plugin present. */
export const hasNativeHealthBridge = (): boolean => getBridge() !== null;

const nativePlatform = (): HealthPlatform => {
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap?.getPlatform?.() === "ios" ? "apple_health" : "health_connect";
};

export const capacitorProvider: HealthProvider = {
  get platform() {
    return typeof window === "undefined" ? ("none" as const) : nativePlatform();
  },

  async checkAvailability(): Promise<HealthAvailability> {
    const bridge = getBridge();
    if (!bridge) return { available: false, platform: "none", reason: "web" };
    try {
      const result = await bridge.checkAvailability();
      return {
        available: result.available === true,
        platform: nativePlatform(),
        ...(result.available
          ? {}
          : { reason: (result.reason as UnavailableReason) ?? "unsupported_os" }),
      };
    } catch {
      return { available: false, platform: nativePlatform(), reason: "unsupported_os" };
    }
  },

  async requestPermissions(): Promise<HealthPermissionStatus> {
    const bridge = getBridge();
    if (!bridge) return "unknown";
    try {
      const { status } = await bridge.requestPermissions();
      return status === "granted" ? "granted" : status === "denied" ? "denied" : "unknown";
    } catch {
      return "denied";
    }
  },

  async getWorkouts(since: Date): Promise<HealthWorkoutSample[]> {
    const bridge = getBridge();
    if (!bridge) return [];
    const { workouts } = await bridge.getWorkouts({ sinceIso: since.toISOString() });
    const source = nativePlatform();
    return (workouts ?? [])
      .filter((w) => w.externalId && w.durationMinutes > 0)
      .map((w) => ({
        externalId: w.externalId,
        source,
        sourceActivityType: w.sourceActivityType,
        activityType: mapPlatformActivityType(w.sourceActivityType),
        startedAt: w.startedAt,
        endedAt: w.endedAt,
        durationMinutes: Math.round(w.durationMinutes),
        distanceKm: w.distanceKm,
        activeEnergyKcal: w.activeEnergyKcal,
      }));
  },
};
