// Provider resolver — returns the right HealthProvider for the current runtime.
//
// TODAY: always returns the web stub, because the app runs as a browser PWA.
//
// WHEN THE NATIVE WRAPPER LANDS (see docs/WEARABLES.md):
//   1. Add Capacitor + a health plugin, and write appleHealthProvider.ts /
//      healthConnectProvider.ts implementing HealthProvider (map samples through
//      mapPlatformActivityType from ../activityTypeMap).
//   2. Detect the native runtime here and return the matching provider, e.g.
//
//        import { Capacitor } from "@capacitor/core";
//        if (Capacitor.isNativePlatform()) {
//          return Capacitor.getPlatform() === "ios"
//            ? appleHealthProvider
//            : healthConnectProvider;
//        }
//
// The rest of the app (useWearableSync, the profile card) is already wired to
// whatever this returns, so this file plus the two provider stubs are the only
// things that change.

import type { HealthProvider } from "../types";
import { webProvider } from "./webProvider";

export const getHealthProvider = (): HealthProvider => {
  return webProvider;
};
