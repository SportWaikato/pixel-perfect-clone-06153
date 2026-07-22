// ── health-provider.ts ──
// Drop into the Karawhiua Expo RN app. Reads exercise/workout minutes from
// Health Connect (Android) and Apple HealthKit (iOS). No zone-2 math — just
// exercise/workout minutes.
//
// Capacitor CANNOT do this: HealthKit and Health Connect are native modules
// that must be linked into a real native build, so the app is Expo React
// Native with a dev-client (not Expo Go, not a Capacitor webview).
//
// Install these packages:
//   npm install react-native-health-connect react-native-health
//
// Then add the config plugins to app.json:
//   "plugins": [
//     ["react-native-health", {
//       "permissions": {
//         "healthSharePermission": { "NSHealthShareUsageDescription": "Reads your workouts to track active minutes." },
//         "healthUpdatePermission": { "NSHealthUpdateUsageDescription": "Does not write health data." }
//       }
//     }],
//     "expo-health-connect"
//   ]
//
// KARAWHIUA EXTENSIONS (marked below): every sample also carries a stable
// externalId and the raw platform activity type, so workouts can be logged as
// discrete Karawhiua activities that de-duplicate against activities.external_id
// and map onto ACTIVITY_TYPES. See karawhiuaHealthSync.ts.

import { Platform, Linking } from 'react-native';

// ──────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────
export interface ActiveMinuteSample {
  externalId: string; // KARAWHIUA: stable id from the platform, for dedupe
  sourceActivityType: string; // KARAWHIUA: raw platform type (e.g. "RUNNING", "HKWorkoutActivityTypeRunning")
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  activeMinutes: number;
  distanceKm?: number; // KARAWHIUA: optional, when the platform reports it
}

export interface HealthSyncResult {
  activeMinutes: number;
  samples: ActiveMinuteSample[]; // KARAWHIUA: discrete workouts, not just the total
  source: 'google_health_connect' | 'apple_health' | 'none';
  permissionGranted: boolean;
  unavailableReason?: string;
}

// ──────────────────────────────────────────────────────────────────
// PLATFORM HELPERS
// ──────────────────────────────────────────────────────────────────
export function isAndroid() {
  return Platform.OS === 'android';
}
export function isIOS() {
  return Platform.OS === 'ios';
}

const minutesBetween = (start: string, end: string): number =>
  Math.round(((new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60) * 100) / 100;

// ──────────────────────────────────────────────────────────────────
// GOOGLE HEALTH CONNECT (Android)
// ──────────────────────────────────────────────────────────────────
let _HealthConnect: any = null;

async function getHealthConnect(): Promise<any | null> {
  if (!isAndroid()) return null;
  if (_HealthConnect === null) {
    try {
      _HealthConnect = await import('react-native-health-connect');
    } catch {
      console.warn('react-native-health-connect not installed');
      _HealthConnect = false;
    }
  }
  return _HealthConnect === false ? null : _HealthConnect;
}

export function openHealthConnectPlayStore() {
  Linking.openURL('market://details?id=com.google.android.apps.healthdata');
}

export async function isHealthConnectAvailable(): Promise<boolean> {
  const hc = await getHealthConnect();
  if (!hc) return false;
  try {
    const ready = await hc.isAvailable();
    if (!ready) return false;
    const granted = await hc.getGrantedPermissions();
    return (granted ?? []).length > 0;
  } catch {
    return false;
  }
}

export async function requestHealthConnectPermissions(): Promise<boolean> {
  const hc = await getHealthConnect();
  if (!hc) return false;

  const available = await hc.isAvailable();
  if (!available) {
    return false;
  }

  try {
    const perms = await hc.requestPermission([
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'ExerciseSession' },
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
    ]);
    return (perms ?? []).length > 0;
  } catch {
    return false;
  }
}

async function readHealthConnectActiveMinutes(dateStr: string): Promise<ActiveMinuteSample[]> {
  const hc = await getHealthConnect();
  if (!hc) return [];

  const startMs = new Date(`${dateStr}T00:00:00`).getTime();
  const endMs = startMs + 24 * 60 * 60 * 1000;

  try {
    const result = await hc.readRecords('ExerciseSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(endMs).toISOString(),
      },
    });

    const sessions = result?.records ?? [];
    return sessions.map((s: any) => ({
      // KARAWHIUA: Health Connect gives a stable per-record id in metadata.
      externalId: `hc:${s.metadata?.id ?? `${s.startTime}-${s.exerciseType ?? 'x'}`}`,
      sourceActivityType: String(s.exerciseType ?? ''),
      startTime: s.startTime,
      endTime: s.endTime,
      activeMinutes: minutesBetween(s.startTime, s.endTime),
    }));
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────
// APPLE HEALTHKIT (iOS)
// ──────────────────────────────────────────────────────────────────
let _AppleHealth: any = null;

async function getAppleHealth(): Promise<any | null> {
  if (!isIOS()) return null;
  if (_AppleHealth === null) {
    try {
      const mod = await import('react-native-health');
      _AppleHealth = mod?.default ?? mod;
    } catch {
      console.warn('react-native-health not installed');
      _AppleHealth = false;
    }
  }
  return _AppleHealth === false ? null : _AppleHealth;
}

export async function isAppleHealthAvailable(): Promise<boolean> {
  const ah = await getAppleHealth();
  if (!ah) return false;

  return new Promise((resolve) => {
    try {
      ah.isAvailable((err: boolean, available: boolean) => resolve(!err && available));
    } catch {
      resolve(false);
    }
  });
}

export async function requestAppleHealthPermissions(): Promise<boolean> {
  const ah = await getAppleHealth();
  if (!ah) return false;

  return new Promise((resolve) => {
    try {
      ah.initHealthKit(
        {
          permissions: {
            read: ['Workout', 'ActiveEnergyBurned', 'StepCount', 'DistanceWalkingRunning'],
            write: [],
          },
        },
        (err: string) => resolve(!err),
      );
    } catch {
      resolve(false);
    }
  });
}

async function readAppleHealthActiveMinutes(dateStr: string): Promise<ActiveMinuteSample[]> {
  const ah = await getAppleHealth();
  if (!ah?.getSamples) return [];

  const startMs = new Date(`${dateStr}T00:00:00`).getTime();
  const endMs = startMs + 24 * 60 * 60 * 1000;

  const options = {
    startDate: new Date(startMs).toISOString(),
    endDate: new Date(endMs).toISOString(),
    limit: 0,
  };

  return new Promise((resolve) => {
    ah.getSamples({ ...options, type: 'Workout' }, (_err: string, results: any[]) => {
      const workouts = results ?? [];
      resolve(
        workouts.map((w: any) => {
          const start = w.startDate ?? w.start;
          const end = w.endDate ?? w.end;
          return {
            // KARAWHIUA: HealthKit workouts carry a UUID; fall back to a
            // deterministic composite so re-syncs stay idempotent.
            externalId: `ah:${w.id ?? w.uuid ?? `${start}-${w.activityName ?? w.activityId ?? 'x'}`}`,
            sourceActivityType: String(w.activityName ?? w.activityId ?? ''),
            startTime: start,
            endTime: end,
            activeMinutes: minutesBetween(start, end),
            distanceKm: typeof w.distance === 'number' ? w.distance / 1000 : undefined,
          };
        }),
      );
    });
  });
}

// ──────────────────────────────────────────────────────────────────
// UNIFIED API
// ──────────────────────────────────────────────────────────────────
export async function checkAndRequestPermission(): Promise<boolean> {
  if (isAndroid()) {
    const available = await isHealthConnectAvailable();
    if (!available) {
      const granted = await requestHealthConnectPermissions();
      return granted;
    }
    return true;
  }

  if (isIOS()) {
    const available = await isAppleHealthAvailable();
    if (!available) return false;
    return await requestAppleHealthPermissions();
  }

  return false;
}

export async function fetchActiveMinutes(
  dateStr: string = new Date().toISOString().split('T')[0],
): Promise<HealthSyncResult> {
  try {
    if (isAndroid()) {
      const granted = await isHealthConnectAvailable();
      if (!granted) {
        return { activeMinutes: 0, samples: [], source: 'none', permissionGranted: false };
      }
      const samples = await readHealthConnectActiveMinutes(dateStr);
      const total = samples.reduce((sum, s) => sum + s.activeMinutes, 0);
      return {
        activeMinutes: Math.round(total),
        samples,
        source: 'google_health_connect',
        permissionGranted: true,
      };
    }

    if (isIOS()) {
      const samples = await readAppleHealthActiveMinutes(dateStr);
      const total = samples.reduce((sum, s) => sum + s.activeMinutes, 0);
      return {
        activeMinutes: Math.round(total),
        samples,
        source: 'apple_health',
        permissionGranted: true,
      };
    }

    return { activeMinutes: 0, samples: [], source: 'none', permissionGranted: false };
  } catch (err) {
    return {
      activeMinutes: 0,
      samples: [],
      source: 'none',
      permissionGranted: false,
      unavailableReason: String(err),
    };
  }
}
