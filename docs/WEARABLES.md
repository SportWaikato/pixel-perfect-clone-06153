# Wearables — HealthKit & Health Connect (future prep)

This documents the wearable-sync groundwork that's already in the repo and the
exact steps to turn it on when the native app ships. Written 2026-07-09.

## The one thing to understand first

**A browser PWA cannot read Apple HealthKit or Android Health Connect.** Those
are native OS APIs with no web bridge — there is no `navigator.health`, and the
W3C never shipped a web equivalent. Reading workouts from a watch *requires a
native wrapper*. So this is genuinely "future prep": the seam, the data model,
and the activity-type mapping are built now; the ~200 lines of native provider
code get written when we wrap the app.

## What's already in the repo

Everything lives under `src/modules/wearables/`:

| File | Role |
| --- | --- |
| `types.ts` | The `HealthProvider` contract every platform implements, plus the `HealthWorkoutSample` shape. |
| `activityTypeMap.ts` | Maps HealthKit `HKWorkoutActivityType` + Health Connect `ExerciseType` → the app's `ACTIVITY_TYPES` keys. Aggressive normalisation, ~120 aliases, `null` when unmatched. |
| `providers/webProvider.ts` | The stub the PWA ships today — reports `available: false, reason: "web"`. |
| `providers/index.ts` | `getHealthProvider()` — the single switch point that will return a native provider on device. |
| `useWearableSync.ts` | React hook (`availability` / `connect()` / `pullWorkouts()`) the UI already calls. |
| `components/WearableSyncCard.tsx` | Profile surface. Shows the honest "coming soon" state now; the live `Connect` branch activates automatically when a provider reports available. |

Because the whole app only ever talks to `HealthProvider` / `useWearableSync`,
turning wearables on is **additive** — no call sites change.

## Turning it on (when we build the native app)

### 1. Add a native wrapper

[Capacitor](https://capacitorjs.com/) is the intended path (keeps the single
React codebase; wraps it as iOS + Android shells):

```bash
npm i @capacitor/core @capacitor/ios @capacitor/android
npx cap init
npx cap add ios && npx cap add android
```

### 2. Add a health plugin

Pick a plugin that exposes both stores, e.g. `capacitor-health` or
`@perfood/capacitor-healthkit` + a Health Connect plugin. Then write the two
providers next to `webProvider.ts`:

- `providers/appleHealthProvider.ts` — `platform: "apple_health"`
- `providers/healthConnectProvider.ts` — `platform: "health_connect"`

Each implements `checkAvailability`, `requestPermissions`, and `getWorkouts`,
mapping every sample's `sourceActivityType` through `mapPlatformActivityType`.

### 3. Flip the resolver

In `providers/index.ts`:

```ts
import { Capacitor } from "@capacitor/core";
if (Capacitor.isNativePlatform()) {
  return Capacitor.getPlatform() === "ios" ? appleHealthProvider : healthConnectProvider;
}
return webProvider;
```

That's it — `WearableSyncCard` starts rendering a working **Connect** button on
device; the web build is unchanged.

### 4. Platform config (permissions & entitlements)

- **iOS / HealthKit**: enable the HealthKit capability in Xcode; add
  `NSHealthShareUsageDescription` (and `NSHealthUpdateUsageDescription` if we
  ever write back) to `Info.plist`. Request **read** scopes for workouts,
  distance, and active energy only — least privilege.
- **Android / Health Connect**: declare `android.permission.health.READ_EXERCISE`
  (+ `READ_DISTANCE`, `READ_ACTIVE_CALORIES_BURNED`) in the manifest, add the
  Health Connect permissions-rationale activity, and handle the "Health Connect
  app not installed" case (`reason: "not_installed"`).

## Data flow once live

```
watch → HealthKit / Health Connect
      → native health plugin
      → appleHealth/healthConnect provider.getWorkouts(since)
      → mapPlatformActivityType()  (→ app activity key)
      → HealthWorkoutSample[]
      → de-dupe on externalId, then create activities via the existing
        activity-logging path (input_type: "device_sync" already exists in
        ACTIVITY_INPUT_TYPES)
```

De-duplication uses `HealthWorkoutSample.externalId` so re-syncing the same day
never double-counts minutes. `input_type: "device_sync"` already exists in the
schema, so synced activities are distinguishable from manual entries.

## Privacy stance

- Request **read-only** scopes, workouts only — never heart-rate streams,
  sleep, or anything not needed to award minutes.
- Health data flows watch → device → our activity records; raw health samples
  are not stored, only the derived minutes/distance already modelled today.
- This mirrors the landing page promise: *"Movement data is used only to run the
  programme and is never sold."*
