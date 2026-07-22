# Karawhiua — native (Expo React Native) staging

This folder holds code for the **future native app**, not the web app. It is a
separate build target: `tsconfig.json` and `eslint.config.js` in the repo root
both exclude `native/`, so nothing here is compiled, typechecked, or linted by
the web project. It won't run until it's dropped into an Expo RN project with
the packages below installed.

## Why native (and not Capacitor)

Apple HealthKit and Android Health Connect are **native modules** — they must be
linked into a real native binary. A browser PWA has no bridge to them, and a
Capacitor webview isn't enough either. The path is **Expo React Native with a
dev-client** (`eas build` or `npx expo run:*`); Expo Go cannot load these
modules.

## What's here

| File | Role |
| --- | --- |
| `health/health-provider.ts` | Reads workout sessions from Health Connect (Android) & HealthKit (iOS). Lazy-imports the native packages so it degrades gracefully if they're absent. Each sample carries a stable `externalId` + raw platform activity type. |
| `health/activityTypeMap.native.ts` | Maps platform workout identifiers → Karawhiua `ACTIVITY_TYPES`. Handles HealthKit **string** names and Health Connect **numeric** enum codes. Unmatched → `null` (student confirms manually). |
| `health/karawhiuaHealthSync.ts` | Reads a day's workouts and logs each via the `log_wearable_activity` Supabase RPC — points computed server-side, deduped on `external_id`. |
| `health/HealthOnboardingScreen.tsx` | Brand-aligned onboarding: detects platform, guides Android users to install Health Connect, requests workout permissions. |

## Backend contract (already in the web repo's migrations)

- `activities.external_id` + unique `(user_id, external_id)` index
  (`20260722010000_wearable_import_dedupe.sql`) — the de-dupe key.
- `log_wearable_activity(...)` RPC
  (`20260722020000_log_wearable_activity_rpc.sql`) — the single server-side
  entry point. It enforces the same guards as manual logging (1–180 min, within
  7 days, 900 min/day cap), computes base/final points, updates the streak, and
  is idempotent per `external_id`. Both web and native call it.

Apply both migrations to Supabase before the native sync can write.

## Install (in the Expo app)

```bash
npm install react-native-health-connect react-native-health
```

`app.json` plugins:

```json
"plugins": [
  ["react-native-health", {
    "permissions": {
      "healthSharePermission": { "NSHealthShareUsageDescription": "Reads your workouts to track active minutes." },
      "healthUpdatePermission": { "NSHealthUpdateUsageDescription": "Does not write health data." }
    }
  }],
  "expo-health-connect"
]
```

## Usage sketch

```tsx
import HealthOnboardingScreen from './native/health/HealthOnboardingScreen';
import { syncHealthToKarawhiua } from './native/health/karawhiuaHealthSync';
// supabase = an authenticated @supabase/supabase-js client for the student

function App() {
  const [onboarded, setOnboarded] = useState(false);
  if (!onboarded) return <HealthOnboardingScreen onComplete={() => setOnboarded(true)} />;

  const sync = async () => {
    const summary = await syncHealthToKarawhiua(supabase);
    console.log(`Logged ${summary.logged} workouts from ${summary.source}`);
  };
  return <YourMainApp onSync={sync} />;
}
```

## Before shipping

- Verify the **Health Connect numeric enum codes** in `activityTypeMap.native.ts`
  against the installed `react-native-health-connect` version on a real device
  — Google has renumbered `ExerciseType` across releases (the ones marked
  `refine` are best-guess placeholders).
- A dev-client build is required; Expo Go won't load the native health modules.
- The web `src/modules/wearables/` string alias table and this native map should
  eventually share one source of truth to avoid drift.
