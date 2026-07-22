# Wearables — HealthKit & Health Connect

How watch sync works and where the code lives. Updated 2026-07-22.

## The one thing to understand first

**A browser PWA cannot read Apple HealthKit or Android Health Connect**, and
**neither can a Capacitor webview** — these are native modules that must be
linked into a real native binary. So watch sync does **not** live in this web
app. It lives in a separate **Expo React Native** app (with a dev-client build),
which reads workouts natively and writes them to the **same Supabase backend**.

The web app's only wearables surface is the honest "coming with the app" card
on the profile (`src/modules/wearables/components/WearableSyncCard.tsx`). Synced
workouts show up in the web app afterwards like any other logged activity —
there's no web-side sync code to maintain.

## Where the native code is

Staged under **`/native/health/`** at the repo root (excluded from the web
`tsconfig` and `eslint` — separate build target):

| File | Role |
| --- | --- |
| `health-provider.ts` | Reads workout sessions from Health Connect (Android) & HealthKit (iOS) via `react-native-health-connect` / `react-native-health`. Each sample carries a stable `externalId` + raw platform type. |
| `activityTypeMap.native.ts` | Maps HealthKit **string** names and Health Connect **numeric** enum codes → the app's `ACTIVITY_TYPES` keys; `null` when unmatched. |
| `karawhiuaHealthSync.ts` | Reads a day's workouts and logs each via the `log_wearable_activity` Supabase RPC. |
| `HealthOnboardingScreen.tsx` | Brand-aligned permission onboarding (guides Android users to install Health Connect). |

See `native/README.md` for install + `app.json` plugin config.

## Backend contract (in this repo's migrations)

- `activities.external_id` + unique `(user_id, external_id)` index
  (`20260722010000_wearable_import_dedupe.sql`) — the de-dupe key.
- `log_wearable_activity(...)` RPC (`20260722020000_log_wearable_activity_rpc.sql`)
  — the single server-side entry point. Enforces the same guards as manual
  logging (1–180 min, within 7 days, 900 min/day), computes base/final points,
  updates the streak, and is idempotent per `external_id`. Apply both to
  Supabase before native sync can write.

## Data flow once live

```
watch → HealthKit / Health Connect
      → react-native-health(-connect)     (native app)
      → health-provider.fetchActiveMinutes(since)
      → mapPlatformActivityType()          (→ app activity key)
      → karawhiuaHealthSync → log_wearable_activity RPC
      → activities row (input_type "device_sync", deduped on external_id)
      → appears in the student's history / dashboard everywhere
```

## Privacy stance

- Request **read-only** scopes, workouts only — never heart-rate streams, sleep,
  or anything not needed to award minutes (see the `app.json` usage strings).
- Health data flows watch → device → our activity records; raw health samples
  are not stored, only the derived minutes/distance already modelled today.
- Mirrors the landing page promise: *"Movement data is used only to run the
  programme and is never sold."*
