import { describe, it, expect } from "vitest";
import {
  ACTIVITY_TYPE_ALIASES,
  activityTypesMatch,
  getEquivalentActivityTypes,
  filterActivitiesByType,
} from "../constants/activityTypeAliases";

describe("ACTIVITY_TYPE_ALIASES", () => {
  it("contains expected mappings", () => {
    expect(ACTIVITY_TYPE_ALIASES["cycling"]).toContain("bike_cycle");
    expect(ACTIVITY_TYPE_ALIASES["bike_cycle"]).toContain("cycling");
    expect(ACTIVITY_TYPE_ALIASES["vr_gaming"]).toContain("gamefit_vr");
    expect(ACTIVITY_TYPE_ALIASES["gamefit_vr"]).toContain("vr_gaming");
    expect(ACTIVITY_TYPE_ALIASES["walking"]).toContain("walk_hike");
    expect(ACTIVITY_TYPE_ALIASES["walk_hike"]).toContain("walking");
  });
});

describe("activityTypesMatch", () => {
  it("handles direct matches", () => {
    expect(activityTypesMatch("cycling", "cycling")).toBeTruthy();
    expect(activityTypesMatch("bike_cycle", "bike_cycle")).toBeTruthy();
    expect(activityTypesMatch("swimming", "swimming")).toBeTruthy();
  });

  it("handles cycling aliases correctly", () => {
    expect(activityTypesMatch("bike_cycle", "cycling")).toBeTruthy();
    expect(activityTypesMatch("cycling", "bike_cycle")).toBeTruthy();
  });

  it("handles VR gaming aliases correctly", () => {
    expect(activityTypesMatch("gamefit_vr", "vr_gaming")).toBeTruthy();
    expect(activityTypesMatch("vr_gaming", "gamefit_vr")).toBeTruthy();
  });

  it("handles walking aliases correctly", () => {
    expect(activityTypesMatch("walk_hike", "walking")).toBeTruthy();
    expect(activityTypesMatch("walking", "walk_hike")).toBeTruthy();
  });

  it("handles team sports aliases correctly", () => {
    expect(activityTypesMatch("team_sport", "team_sports")).toBeTruthy();
    expect(activityTypesMatch("team_sports", "team_sport")).toBeTruthy();
  });

  it("handles gym/fitness aliases correctly", () => {
    expect(activityTypesMatch("workout_gym", "gym_fitness")).toBeTruthy();
    expect(activityTypesMatch("gym_fitness", "workout_gym")).toBeTruthy();
  });

  it("handles running aliases correctly", () => {
    expect(activityTypesMatch("run_jog", "running")).toBeTruthy();
    expect(activityTypesMatch("running", "run_jog")).toBeTruthy();
  });

  it("rejects unrelated types", () => {
    expect(activityTypesMatch("cycling", "swimming")).toBeFalsy();
    expect(activityTypesMatch("bike_cycle", "running")).toBeFalsy();
    expect(activityTypesMatch("gamefit_vr", "walking")).toBeFalsy();
    expect(activityTypesMatch("unknown_type", "cycling")).toBeFalsy();
  });
});

describe("getEquivalentActivityTypes", () => {
  it("returns all cycling equivalents", () => {
    const cyclingTypes = getEquivalentActivityTypes("cycling");
    expect(cyclingTypes).toContain("bike_cycle");
    expect(cyclingTypes).toContain("cycling");
  });

  it("returns all VR gaming equivalents", () => {
    const vrTypes = getEquivalentActivityTypes("vr_gaming");
    expect(vrTypes).toContain("gamefit_vr");
    expect(vrTypes).toContain("vr_gaming");
  });

  it("returns single type for unmapped activities", () => {
    expect(getEquivalentActivityTypes("swimming")).toEqual(["swimming"]);
  });
});

describe("filterActivitiesByType", () => {
  it("filters cycling activities correctly", () => {
    const mockActivities = [
      { id: 1, activity_type: "bike_cycle", duration_minutes: 30 },
      { id: 2, activity_type: "cycling", duration_minutes: 45 },
      { id: 3, activity_type: "running", duration_minutes: 20 },
      { id: 4, activity_type: "swimming", duration_minutes: 25 },
    ];
    const result = filterActivitiesByType(mockActivities, "cycling");
    expect(result.length).toBe(2);
    expect(result[0].activity_type).toBe("bike_cycle");
    expect(result[1].activity_type).toBe("cycling");
  });

  it("filters VR gaming activities correctly", () => {
    const mockActivities = [
      { id: 1, activity_type: "gamefit_vr", duration_minutes: 30 },
      { id: 2, activity_type: "vr_gaming", duration_minutes: 45 },
      { id: 3, activity_type: "cycling", duration_minutes: 20 },
    ];
    const result = filterActivitiesByType(mockActivities, "vr_gaming");
    expect(result.length).toBe(2);
    expect(result[0].activity_type).toBe("gamefit_vr");
    expect(result[1].activity_type).toBe("vr_gaming");
  });

  it("handles empty arrays", () => {
    expect(filterActivitiesByType([], "cycling")).toEqual([]);
  });

  it("handles no matches", () => {
    const mockActivities = [
      { id: 1, activity_type: "swimming", duration_minutes: 30 },
      { id: 2, activity_type: "running", duration_minutes: 45 },
    ];
    expect(filterActivitiesByType(mockActivities, "cycling")).toEqual([]);
  });
});

describe("Real-world badge scenarios", () => {
  it("Bill Cooksley cycling badge scenario", () => {
    expect(activityTypesMatch("bike_cycle", "cycling")).toBeTruthy();
  });

  it("VR gaming badge scenario", () => {
    expect(activityTypesMatch("gamefit_vr", "vr_gaming")).toBeTruthy();
  });

  it("Badge system backwards compatibility", () => {
    expect(activityTypesMatch("cycling", "cycling")).toBeTruthy();
    expect(activityTypesMatch("vr_gaming", "vr_gaming")).toBeTruthy();
    expect(activityTypesMatch("bike_cycle", "bike_cycle")).toBeTruthy();
    expect(activityTypesMatch("gamefit_vr", "gamefit_vr")).toBeTruthy();
    expect(activityTypesMatch("bike_cycle", "cycling")).toBeTruthy();
    expect(activityTypesMatch("gamefit_vr", "vr_gaming")).toBeTruthy();
  });
});
