import { describe, it, expect } from "vitest";
import {
  getNZDate,
  getActivityDisplayName,
  getUserInitials,
  computeGroupRejectableIds,
} from "./activityUtils";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";

// Minimal activity factory for these tests
function makeActivity(
  overrides: Partial<ActivityInterface> & { id: string; user_id: string; created_at: string },
): ActivityInterface {
  return {
    updated_at: overrides.created_at,
    activity_type: "walking",
    distance_km: 0,
    feeling: "happy",
    participation_type: "solo",
    input_type: "time",
    is_verified: false,
    is_rejected: false,
    is_flagged: false,
    house_points_awarded: 0,
    duration_minutes: 60,
    ...overrides,
  };
}

// A known NZ-afternoon timestamp: 2024-01-15T01:00:00Z = Jan 15 2:00 PM NZDT (UTC+13)
const JAN15_UTC_AFTERNOON = "2024-01-15T01:00:00.000Z";
// A timestamp that is Jan 14 UTC but Jan 15 NZ: 2024-01-14T12:00:00Z = Jan 15 1:00 AM NZDT
const JAN14_UTC_BUT_JAN15_NZ = "2024-01-14T12:00:00.000Z";
// A timestamp that is Jan 15 UTC but Jan 16 NZ: 2024-01-15T12:00:00Z = Jan 16 1:00 AM NZDT
const JAN15_UTC_BUT_JAN16_NZ = "2024-01-15T12:00:00.000Z";

describe("getNZDate", () => {
  it("returns YYYY-MM-DD format", () => {
    expect(getNZDate(JAN15_UTC_AFTERNOON)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns NZ date, not UTC date, for a UTC midnight-ish timestamp", () => {
    // Jan 14 UTC but Jan 15 NZ (UTC+13 NZDT)
    expect(getNZDate(JAN14_UTC_BUT_JAN15_NZ)).toBe("2024-01-15");
  });

  it("advances to next NZ day for late UTC timestamps", () => {
    // Jan 15 UTC but Jan 16 NZ
    expect(getNZDate(JAN15_UTC_BUT_JAN16_NZ)).toBe("2024-01-16");
  });
});

describe("getActivityDisplayName", () => {
  it("returns custom_activity_name when type is something_else", () => {
    const a = makeActivity({
      id: "1",
      user_id: "u1",
      created_at: JAN15_UTC_AFTERNOON,
      activity_type: "something_else",
      custom_activity_name: "Juggling",
    });
    expect(getActivityDisplayName(a)).toBe("Juggling");
  });

  it("returns ACTIVITY_TYPES label for known type", () => {
    const a = makeActivity({
      id: "1",
      user_id: "u1",
      created_at: JAN15_UTC_AFTERNOON,
      activity_type: "run_jog",
    });
    expect(getActivityDisplayName(a)).toBe("Run / Jog");
  });

  it('falls back to replace("_", " ") for unknown type not in ACTIVITY_TYPES', () => {
    const a = makeActivity({
      id: "1",
      user_id: "u1",
      created_at: JAN15_UTC_AFTERNOON,
      activity_type: "made_up_type",
    });
    // replace() without regex only replaces the first underscore — this documents the current behavior
    expect(getActivityDisplayName(a)).toBe("made up_type");
  });
});

describe("getUserInitials", () => {
  it('returns "?" when activity has no user', () => {
    const a = makeActivity({ id: "1", user_id: "u1", created_at: JAN15_UTC_AFTERNOON });
    expect(getUserInitials(a)).toBe("?");
  });

  it("returns uppercased initials from first_name and last_name", () => {
    const a = makeActivity({
      id: "1",
      user_id: "u1",
      created_at: JAN15_UTC_AFTERNOON,
      user: { first_name: "Jane", last_name: "Smith" } as any,
    });
    expect(getUserInitials(a)).toBe("JS");
  });

  it("handles missing first_name gracefully", () => {
    const a = makeActivity({
      id: "1",
      user_id: "u1",
      created_at: JAN15_UTC_AFTERNOON,
      user: { first_name: "", last_name: "Smith" } as any,
    });
    expect(getUserInitials(a)).toBe("S");
  });

  it("handles missing last_name gracefully", () => {
    const a = makeActivity({
      id: "1",
      user_id: "u1",
      created_at: JAN15_UTC_AFTERNOON,
      user: { first_name: "Jane", last_name: "" } as any,
    });
    expect(getUserInitials(a)).toBe("J");
  });
});

describe("computeGroupRejectableIds", () => {
  // Helper: build flagged-day activities for same user and NZ date
  const DAY = JAN15_UTC_AFTERNOON; // Jan 15 NZ

  it("happy path: 3 non-rejected activities on same flagged day → each maps to the other two", () => {
    const activities = [
      makeActivity({ id: "a1", user_id: "u1", created_at: DAY, is_flagged: true }),
      makeActivity({ id: "a2", user_id: "u1", created_at: DAY, is_flagged: true }),
      makeActivity({ id: "a3", user_id: "u1", created_at: DAY, is_flagged: true }),
    ];

    const map = computeGroupRejectableIds(activities);

    expect(map.get("a1")).toEqual(expect.arrayContaining(["a1", "a2", "a3"]));
    expect(map.get("a2")).toEqual(expect.arrayContaining(["a1", "a2", "a3"]));
    expect(map.get("a3")).toEqual(expect.arrayContaining(["a1", "a2", "a3"]));
  });

  it("rejected activity on flagged day: in map, maps to the non-rejected siblings (not itself)", () => {
    const activities = [
      makeActivity({ id: "a1", user_id: "u1", created_at: DAY, is_flagged: true }),
      makeActivity({
        id: "a2",
        user_id: "u1",
        created_at: DAY,
        is_flagged: true,
        is_rejected: true,
      }),
      makeActivity({ id: "a3", user_id: "u1", created_at: DAY, is_flagged: true }),
    ];

    const map = computeGroupRejectableIds(activities);

    // Rejected activity maps to the non-rejected siblings (the still-rejectable set for that day)
    expect(map.get("a2")).toEqual(expect.arrayContaining(["a1", "a3"]));
    expect(map.get("a2")).not.toContain("a2"); // not itself — it's already rejected
    // Non-rejected activities also map to the non-rejected set (excludes rejected sibling)
    expect(map.get("a1")).toEqual(expect.arrayContaining(["a1", "a3"]));
    expect(map.get("a1")).not.toContain("a2");
  });

  it("activity on non-flagged day is absent from the map", () => {
    const activities = [
      makeActivity({ id: "a1", user_id: "u1", created_at: DAY, is_flagged: false }),
    ];

    const map = computeGroupRejectableIds(activities);
    expect(map.has("a1")).toBe(false);
  });

  it("mixed flagged and non-flagged days: only flagged-day activities appear", () => {
    // Use a different date for the non-flagged activity (earlier UTC day, still Jan 14 NZ)
    const OTHER_DAY = "2024-01-13T12:00:00.000Z"; // Jan 14 NZ (well before Jan 15)
    const activities = [
      makeActivity({ id: "a1", user_id: "u1", created_at: DAY, is_flagged: true }),
      makeActivity({ id: "a2", user_id: "u1", created_at: OTHER_DAY, is_flagged: false }),
    ];

    const map = computeGroupRejectableIds(activities);
    expect(map.has("a1")).toBe(true);
    expect(map.has("a2")).toBe(false);
  });

  it("user A's flagged day doesn't bleed into user B's map entries", () => {
    const activities = [
      makeActivity({ id: "a1", user_id: "u1", created_at: DAY, is_flagged: true }),
      makeActivity({ id: "b1", user_id: "u2", created_at: DAY, is_flagged: false }),
    ];

    const map = computeGroupRejectableIds(activities);
    expect(map.has("a1")).toBe(true);
    expect(map.has("b1")).toBe(false);
  });

  it("NZ date boundary: activities on different NZ days are in separate buckets", () => {
    // Jan 14 UTC = Jan 15 NZ (UTC+13)
    const NZ_JAN15 = "2024-01-14T12:00:00.000Z";
    // Jan 15 UTC = Jan 16 NZ
    const NZ_JAN16 = "2024-01-15T12:00:00.000Z";

    const activities = [
      makeActivity({ id: "a1", user_id: "u1", created_at: NZ_JAN15, is_flagged: true }),
      makeActivity({ id: "a2", user_id: "u1", created_at: NZ_JAN16, is_flagged: true }),
    ];

    const map = computeGroupRejectableIds(activities);

    // Each activity is on its own day; the rejectable set for each should only contain itself
    expect(map.get("a1")).toEqual(["a1"]);
    expect(map.get("a2")).toEqual(["a2"]);
    expect(map.get("a1")).not.toContain("a2");
    expect(map.get("a2")).not.toContain("a1");
  });

  it("returns empty map for empty input", () => {
    expect(computeGroupRejectableIds([])).toEqual(new Map());
  });
});
