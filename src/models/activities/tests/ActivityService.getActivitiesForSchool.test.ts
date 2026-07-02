import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActivityService } from "../services/ActivityService";
import { makeSupabaseMock } from "@/models/__tests__/utils/supabaseMock";

// A timestamp in the middle of a NZ day — no timezone ambiguity for these tests
const NZ_DAY = "2024-01-15T01:00:00.000Z"; // Jan 15 ~2pm NZ

function makeRawActivity(overrides: {
  id: string;
  user_id: string;
  created_at?: string;
  duration_minutes: number;
  is_rejected?: boolean;
}) {
  return {
    id: overrides.id,
    user_id: overrides.user_id,
    created_at: overrides.created_at ?? NZ_DAY,
    duration_minutes: overrides.duration_minutes,
    is_rejected: overrides.is_rejected ?? false,
    activity_type: "walking",
    user: {
      id: overrides.user_id,
      username: "tester",
      first_name: "Test",
      last_name: "User",
      school_id: "school-1",
      house: null,
    },
  };
}

function setupSchoolMock(
  supabase: ReturnType<typeof makeSupabaseMock>,
  {
    schoolUsers,
    allActivities,
    pagedActivities,
  }: {
    schoolUsers: { id: string }[];
    allActivities: ReturnType<typeof makeRawActivity>[];
    pagedActivities: ReturnType<typeof makeRawActivity>[];
  },
) {
  // Track how many times from('activities') is called
  let activitiesFromCount = 0;

  supabase.from = vi.fn().mockImplementation((table: string) => {
    const chain = { ...supabase._chain };
    chain.select = vi.fn().mockReturnThis();
    chain.eq = vi.fn().mockReturnThis();
    chain.in = vi.fn().mockReturnThis();
    chain.order = vi.fn().mockReturnThis();
    chain.range = vi.fn().mockReturnThis();

    if (table === "users") {
      // School user lookup: .select('id').eq('school_id', schoolId).eq('is_deleted', false)
      const terminalEq = vi.fn().mockResolvedValue({ data: schoolUsers, error: null });
      chain.eq = vi.fn().mockReturnValue({ ...chain, eq: terminalEq });
    } else if (table === "activities") {
      activitiesFromCount++;
      if (activitiesFromCount === 1) {
        // First call: daily totals query — .select().in() resolves directly
        chain.in = vi.fn().mockResolvedValue({ data: allActivities, error: null });
      } else {
        // Second call: paginated query — .select().order().range().in() must all work
        // Build terminal object that resolves when awaited
        const terminalIn = vi.fn().mockResolvedValue({ data: pagedActivities, error: null });
        const afterRange = { ...chain, in: terminalIn };
        const afterOrder = { ...chain, range: vi.fn().mockReturnValue(afterRange) };
        chain.order = vi.fn().mockReturnValue(afterOrder);
        // Also support null-schoolId path where .in() is not called (await pageBaseQuery directly)
        chain.range = vi.fn().mockReturnValue(afterRange);
      }
    }

    return chain;
  });
}

describe("ActivityService.getActivitiesForSchool — flagging logic", () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: ActivityService;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    service = new ActivityService(supabase as any);
  });

  it("returns [] immediately when school has no users", async () => {
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      const terminalEq = vi.fn().mockResolvedValue({ data: [], error: null });
      chain.eq = vi.fn().mockReturnValue({ ...chain, eq: terminalEq });
      return chain;
    });

    const result = await service.getActivitiesForSchool("school-1");
    expect(result).toEqual([]);
  });

  it("flags all activities when daily total >= 540 min", async () => {
    const allActs = [
      makeRawActivity({ id: "a1", user_id: "u1", duration_minutes: 200 }),
      makeRawActivity({ id: "a2", user_id: "u1", duration_minutes: 200 }),
      makeRawActivity({ id: "a3", user_id: "u1", duration_minutes: 140 }), // 200+200+140 = 540
    ];
    setupSchoolMock(supabase, {
      schoolUsers: [{ id: "u1" }],
      allActivities: allActs,
      pagedActivities: allActs,
    });

    const result = await service.getActivitiesForSchool("school-1");
    expect(result.every((a) => a.is_flagged)).toBe(true);
  });

  it("does NOT flag activities when daily total < 540 min", async () => {
    const allActs = [
      makeRawActivity({ id: "a1", user_id: "u1", duration_minutes: 200 }),
      makeRawActivity({ id: "a2", user_id: "u1", duration_minutes: 200 }),
      makeRawActivity({ id: "a3", user_id: "u1", duration_minutes: 139 }), // 539 total
    ];
    setupSchoolMock(supabase, {
      schoolUsers: [{ id: "u1" }],
      allActivities: allActs,
      pagedActivities: allActs,
    });

    const result = await service.getActivitiesForSchool("school-1");
    expect(result.every((a) => !a.is_flagged)).toBe(true);
  });

  it("rejected activity on a flagged day gets is_flagged: false", async () => {
    const allActs = [
      makeRawActivity({ id: "a1", user_id: "u1", duration_minutes: 300 }),
      makeRawActivity({ id: "a2", user_id: "u1", duration_minutes: 300, is_rejected: true }),
    ]; // 600 total → flagged day
    setupSchoolMock(supabase, {
      schoolUsers: [{ id: "u1" }],
      allActivities: allActs,
      pagedActivities: allActs,
    });

    const result = await service.getActivitiesForSchool("school-1");
    const rejected = result.find((a) => a.id === "a2");
    const nonRejected = result.find((a) => a.id === "a1");
    expect(rejected?.is_flagged).toBe(false);
    expect(nonRejected?.is_flagged).toBe(true);
  });

  it("user A's flagged day does not affect user B's activities", async () => {
    const allActs = [
      makeRawActivity({ id: "a1", user_id: "u1", duration_minutes: 600 }), // u1 flagged
      makeRawActivity({ id: "b1", user_id: "u2", duration_minutes: 60 }), // u2 not flagged
    ];
    setupSchoolMock(supabase, {
      schoolUsers: [{ id: "u1" }, { id: "u2" }],
      allActivities: allActs,
      pagedActivities: allActs,
    });

    const result = await service.getActivitiesForSchool("school-1");
    const u1Act = result.find((a) => a.id === "a1");
    const u2Act = result.find((a) => a.id === "b1");
    expect(u1Act?.is_flagged).toBe(true);
    expect(u2Act?.is_flagged).toBe(false);
  });
});
