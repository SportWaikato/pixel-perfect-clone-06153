import { describe, it, expect } from "vitest";
import {
  normalizeWorkoutScan,
  SCANNABLE_ACTIVITY_TYPES,
} from "@/models/ai/utils/normalizeWorkoutScan";
import { ACTIVITY_TYPES } from "@/models/activities/interfaces/ActivityInterface";
import { MAX_ACTIVITY_DURATION_MINUTES } from "@/models/activities/constants/activityValidationConstants";

describe("normalizeWorkoutScan", () => {
  it("passes through canonical activity keys and sane durations", () => {
    expect(normalizeWorkoutScan({ activity_type: "run_jog", duration_minutes: 30 })).toEqual({
      activity_type: "run_jog",
      duration_minutes: 30,
    });
  });

  it("maps common fitness-app synonyms to canonical keys", () => {
    expect(normalizeWorkoutScan({ activity_type: "swim", duration_minutes: 45 })).toEqual({
      activity_type: "swimming",
      duration_minutes: 45,
    });
    expect(normalizeWorkoutScan({ activity_type: "gym_workout", duration_minutes: 20 })).toEqual({
      activity_type: "workout_gym",
      duration_minutes: 20,
    });
    expect(normalizeWorkoutScan({ activity_type: "Indoor Cycling", duration_minutes: 60 })).toEqual(
      { activity_type: "bike_cycle", duration_minutes: 60 },
    );
  });

  it("rejects unknown activity types instead of inserting invalid keys", () => {
    const result = normalizeWorkoutScan({
      activity_type: "underwater_hockey",
      duration_minutes: 30,
    });
    expect(result.activity_type).toBeNull();
    expect(result.duration_minutes).toBe(30);
  });

  it("never returns survey_completion", () => {
    expect(SCANNABLE_ACTIVITY_TYPES).not.toContain("survey_completion");
    expect(
      normalizeWorkoutScan({ activity_type: "survey_completion", duration_minutes: 10 })
        .activity_type,
    ).toBeNull();
  });

  it("clamps absurd durations to the max activity duration", () => {
    expect(
      normalizeWorkoutScan({ activity_type: "run_jog", duration_minutes: 100000 }).duration_minutes,
    ).toBe(MAX_ACTIVITY_DURATION_MINUTES);
  });

  it("rejects zero, negative and non-numeric durations", () => {
    expect(normalizeWorkoutScan({ duration_minutes: 0 }).duration_minutes).toBeNull();
    expect(normalizeWorkoutScan({ duration_minutes: -5 }).duration_minutes).toBeNull();
    expect(normalizeWorkoutScan({ duration_minutes: "abc" }).duration_minutes).toBeNull();
  });

  it("handles null / malformed model output", () => {
    expect(normalizeWorkoutScan(null)).toEqual({ activity_type: null, duration_minutes: null });
    expect(normalizeWorkoutScan("junk")).toEqual({ activity_type: null, duration_minutes: null });
    expect(normalizeWorkoutScan({ activity_type: null, duration_minutes: null })).toEqual({
      activity_type: null,
      duration_minutes: null,
    });
  });

  it("every scannable key is a real ACTIVITY_TYPES key", () => {
    for (const key of SCANNABLE_ACTIVITY_TYPES) {
      expect(ACTIVITY_TYPES).toHaveProperty(key);
    }
  });
});
