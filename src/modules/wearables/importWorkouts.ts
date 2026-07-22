// Turns pulled health-store workouts into logged activities.
//
// Dedupe happens twice: a pre-check against already-imported external_ids
// (cheap, avoids burning the daily minutes cap on duplicates) and the DB's
// unique (user_id, external_id) index as the hard guarantee. Individual
// failures (e.g. a workout outside the 7-day window or over the daily cap)
// skip that sample and keep going.

import { SupabaseClient } from "@supabase/supabase-js";
import { ActivityService } from "@/models/activities/services/ActivityService";
import type { HealthWorkoutSample } from "./types";

export interface ImportResult {
  imported: number;
  skippedDuplicates: number;
  skippedUnmapped: number;
  failed: number;
}

export const importWorkouts = async (
  supabase: SupabaseClient,
  userId: string,
  samples: HealthWorkoutSample[],
): Promise<ImportResult> => {
  const result: ImportResult = {
    imported: 0,
    skippedDuplicates: 0,
    skippedUnmapped: 0,
    failed: 0,
  };
  if (samples.length === 0) return result;

  const externalIds = samples.map((s) => s.externalId);
  const { data: existing } = await supabase
    .from("activities")
    .select("external_id")
    .eq("user_id", userId)
    .in("external_id", externalIds);
  const seen = new Set((existing ?? []).map((row) => row.external_id as string));

  const activityService = new ActivityService(supabase);

  for (const sample of samples) {
    if (seen.has(sample.externalId)) {
      result.skippedDuplicates += 1;
      continue;
    }
    if (!sample.activityType) {
      result.skippedUnmapped += 1;
      continue;
    }
    try {
      await activityService.create({
        user_id: userId,
        activity_type: sample.activityType,
        duration_minutes: sample.durationMinutes,
        distance_km: sample.distanceKm ?? 0,
        feeling: "happy",
        participation_type: "solo",
        input_type: "time",
        description: `Synced from ${sample.source === "apple_health" ? "Apple Health" : "Health Connect"}`,
        created_at: sample.startedAt,
        external_id: sample.externalId,
      });
      seen.add(sample.externalId);
      result.imported += 1;
    } catch {
      // Outside the logging window, over the daily cap, or a race on the
      // unique index — skip this one and keep importing the rest.
      result.failed += 1;
    }
  }

  return result;
};
