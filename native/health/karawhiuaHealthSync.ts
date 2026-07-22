// ── karawhiuaHealthSync.ts ──
// Connects the generic health reader (health-provider.ts) to the Karawhiua
// backend. Reads today's workouts, maps each to an app activity type, and logs
// them through the log_wearable_activity Supabase RPC — which computes points,
// enforces the same caps as manual logging, and de-duplicates on external_id
// (so re-syncing the same day never double-counts).
//
// Requires @supabase/supabase-js in the native app, authenticated as the
// student (the RPC derives the user from auth.uid()).

import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchActiveMinutes, type HealthSyncResult } from './health-provider';
import { mapPlatformActivityType } from './activityTypeMap.native';

export interface SyncSummary {
  source: HealthSyncResult['source'];
  totalActiveMinutes: number;
  logged: number;
  duplicates: number;
  unmapped: number;
  failed: number;
}

/**
 * Sync one day's workouts (defaults to today) into Karawhiua.
 * Idempotent: safe to call repeatedly — already-logged workouts are skipped
 * server-side by the unique (user_id, external_id) index.
 */
export async function syncHealthToKarawhiua(
  supabase: SupabaseClient,
  dateStr: string = new Date().toISOString().split('T')[0],
): Promise<SyncSummary> {
  const result = await fetchActiveMinutes(dateStr);

  const summary: SyncSummary = {
    source: result.source,
    totalActiveMinutes: result.activeMinutes,
    logged: 0,
    duplicates: 0,
    unmapped: 0,
    failed: 0,
  };

  if (!result.permissionGranted || result.samples.length === 0) {
    return summary;
  }

  for (const sample of result.samples) {
    const activityType = mapPlatformActivityType(sample.sourceActivityType);
    // Skip zero/sub-minute sessions and anything we can't confidently map.
    const minutes = Math.round(sample.activeMinutes);
    if (minutes < 1) continue;
    if (!activityType) {
      summary.unmapped += 1;
      continue;
    }

    try {
      const { error } = await supabase.rpc('log_wearable_activity', {
        p_external_id: sample.externalId,
        p_activity_type: activityType,
        p_duration_minutes: Math.min(minutes, 180),
        p_started_at: sample.startTime,
        p_distance_km: sample.distanceKm ?? 0,
        p_source: result.source,
      });
      if (error) {
        // A duplicate returns the existing id without error; a real failure
        // (e.g. daily cap, outside window) surfaces here.
        summary.failed += 1;
      } else {
        summary.logged += 1;
      }
    } catch {
      summary.failed += 1;
    }
  }

  return summary;
}
