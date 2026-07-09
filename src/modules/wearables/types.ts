// Wearable / health-platform integration — shared contract.
//
// ARCHITECTURE NOTE (read before implementing a provider):
// Karawhiua ships as a PWA. A browser PWA CANNOT read Apple HealthKit or
// Android Health Connect — those are native OS APIs with no web bridge. Pulling
// workout data from a watch therefore requires a NATIVE WRAPPER (Capacitor is
// the intended path — see docs/WEARABLES.md) that exposes a plugin implementing
// the `HealthProvider` interface below.
//
// This module is the seam that makes that future drop-in cheap: the whole app
// talks to `HealthProvider`, and only ONE file (the native provider) has to be
// written when the wrapper lands. Everything else — the UI surface, the
// activity-type mapping, the sync hook — is already here and stays unchanged.

import type { ACTIVITY_TYPES } from "@/models/activities/interfaces/ActivityInterface";

/** App activity-type key (e.g. "run_jog"). Kept in sync with ACTIVITY_TYPES. */
export type ActivityTypeKey = keyof typeof ACTIVITY_TYPES;

/** The health platform a provider talks to. */
export type HealthPlatform = "apple_health" | "health_connect" | "none";

/** Why a provider is (un)available — drives the UI copy. */
export type UnavailableReason =
  | "web" // running as a browser PWA — no native bridge
  | "unsupported_os" // native wrapper present but OS has no health store
  | "not_installed" // Health Connect app not installed (Android)
  | "permission_denied"; // user declined the health permission prompt

/** A single workout/exercise session read from the health store. */
export interface HealthWorkoutSample {
  /** Stable id from the source platform, used to de-duplicate on re-sync. */
  externalId: string;
  /** Which platform this came from. */
  source: HealthPlatform;
  /** Raw platform activity identifier (e.g. HKWorkoutActivityType name). */
  sourceActivityType: string;
  /** Best-effort mapping to an app activity type, or null if unmatched. */
  activityType: ActivityTypeKey | null;
  startedAt: string; // ISO 8601
  endedAt: string; // ISO 8601
  durationMinutes: number;
  distanceKm?: number;
  activeEnergyKcal?: number;
}

/** Result of asking a provider whether it can be used right now. */
export interface HealthAvailability {
  available: boolean;
  platform: HealthPlatform;
  /** Present only when available === false. */
  reason?: UnavailableReason;
}

/** Whether the user has granted the health-read permission. */
export type HealthPermissionStatus = "granted" | "denied" | "unknown";

/**
 * The one interface a native wrapper must implement. The web build ships a
 * stub (see providers/webProvider.ts) that reports `available: false, reason:
 * "web"` so the UI can render an honest "coming soon" state today.
 */
export interface HealthProvider {
  readonly platform: HealthPlatform;
  /** Cheap capability check — safe to call on every render/mount. */
  checkAvailability(): Promise<HealthAvailability>;
  /** Trigger the OS permission sheet. No-op on the web stub. */
  requestPermissions(): Promise<HealthPermissionStatus>;
  /** Pull workouts recorded on/after `since`. Empty on the web stub. */
  getWorkouts(since: Date): Promise<HealthWorkoutSample[]>;
}
