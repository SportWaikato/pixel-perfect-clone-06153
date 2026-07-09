// The provider the browser PWA ships with today.
//
// A PWA has no bridge to HealthKit / Health Connect, so this reports itself
// unavailable with reason "web". The UI reads that and shows the honest
// "coming with the native app" state instead of a dead button. When the
// Capacitor wrapper lands, the platform resolver (./index.ts) returns a native
// provider instead of this one — nothing else changes.

import type {
  HealthProvider,
  HealthAvailability,
  HealthPermissionStatus,
  HealthWorkoutSample,
} from "../types";

export const webProvider: HealthProvider = {
  platform: "none",

  async checkAvailability(): Promise<HealthAvailability> {
    return { available: false, platform: "none", reason: "web" };
  },

  async requestPermissions(): Promise<HealthPermissionStatus> {
    // No OS permission sheet exists in a browser.
    return "unknown";
  },

  async getWorkouts(): Promise<HealthWorkoutSample[]> {
    return [];
  },
};
