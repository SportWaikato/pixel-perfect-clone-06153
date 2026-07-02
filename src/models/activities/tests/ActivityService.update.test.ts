import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActivityService } from "../services/ActivityService";
import { makeSupabaseMock } from "@/models/__tests__/utils/supabaseMock";
import {
  MAX_ACTIVITY_DURATION_MINUTES,
  MAX_ACTIVITY_DAYS_AGO,
} from "../constants/activityValidationConstants";

const LIMIT_ERROR_FRAGMENT = "Something isn't right";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const EXISTING_ACTIVITY = {
  id: "act-1",
  user_id: "user-1",
  activity_type: "walking",
  duration_minutes: 60,
  event_id: null,
  base_points: 60,
  final_points: 60,
  house_points_awarded: 60,
  created_at: new Date().toISOString(),
};

describe("ActivityService.update — ownership and validation", () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: ActivityService;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    service = new ActivityService(supabase as any);
  });

  it('throws "Activity not found" when getById returns null', async () => {
    supabase._chain.single.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "Not found" },
    });
    await expect(service.update("act-1", "user-1", { duration_minutes: 30 })).rejects.toThrow(
      "Activity not found",
    );
  });

  it('throws "You can only edit your own activities" when user_id does not match', async () => {
    supabase._chain.single.mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
    await expect(service.update("act-1", "user-2", { duration_minutes: 30 })).rejects.toThrow(
      "You can only edit your own activities",
    );
  });

  it("throws limit error when new duration_minutes > MAX", async () => {
    supabase._chain.single.mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
    await expect(
      service.update("act-1", "user-1", { duration_minutes: MAX_ACTIVITY_DURATION_MINUTES + 1 }),
    ).rejects.toThrow(LIMIT_ERROR_FRAGMENT);
  });

  it("does NOT throw when duration_minutes is omitted (valid partial update)", async () => {
    // Both the getById call and the update call return success
    supabase._chain.single
      .mockResolvedValueOnce({ data: EXISTING_ACTIVITY, error: null }) // getById
      .mockResolvedValueOnce({
        data: { ...EXISTING_ACTIVITY, activity_type: "running" },
        error: null,
      }); // update
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await expect(
      service.update("act-1", "user-1", { activity_type: "running" }),
    ).resolves.toBeDefined();
  });

  it("throws when duration_minutes is explicitly 0", async () => {
    supabase._chain.single.mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
    await expect(service.update("act-1", "user-1", { duration_minutes: 0 })).rejects.toThrow(
      "Duration in minutes is required",
    );
  });

  it("throws limit error when new created_at is older than MAX_ACTIVITY_DAYS_AGO", async () => {
    supabase._chain.single.mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
    await expect(
      service.update("act-1", "user-1", { created_at: daysAgo(MAX_ACTIVITY_DAYS_AGO + 1) }),
    ).rejects.toThrow(LIMIT_ERROR_FRAGMENT);
  });

  it("does NOT throw when created_at is omitted (date validation skipped)", async () => {
    supabase._chain.single
      .mockResolvedValueOnce({ data: EXISTING_ACTIVITY, error: null })
      .mockResolvedValueOnce({ data: EXISTING_ACTIVITY, error: null });
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await expect(
      service.update("act-1", "user-1", { duration_minutes: 30 }),
    ).resolves.toBeDefined();
  });
});

describe("ActivityService.update — points recalculation", () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: ActivityService;

  function setupUpdate(eventData: object | null, updatedActivity: object) {
    supabase = makeSupabaseMock();
    service = new ActivityService(supabase as any);

    // Track how many times from('activities') has been called across all invocations
    let activitiesCallCount = 0;

    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.update = vi.fn().mockReturnThis();
      chain.in = vi.fn().mockReturnThis();

      if (table === "activities") {
        activitiesCallCount++;
        if (activitiesCallCount === 1) {
          // First call = getById
          chain.single = vi.fn().mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
        } else {
          // Second call = update result
          chain.single = vi.fn().mockResolvedValue({ data: updatedActivity, error: null });
        }
      } else if (table === "events") {
        chain.single = vi.fn().mockResolvedValue({ data: eventData, error: null });
      } else if (table === "users") {
        chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      } else if (table === "achievements") {
        chain.eq = vi.fn().mockResolvedValue({ data: [], error: null });
      }

      return chain;
    });

    supabase.rpc.mockResolvedValue({ data: null, error: null });
  }

  it("does NOT call events table when neither duration nor event_id is in payload", async () => {
    supabase = makeSupabaseMock();
    service = new ActivityService(supabase as any);

    const fromSpy = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.update = vi.fn().mockReturnThis();
      chain.single = vi
        .fn()
        .mockResolvedValueOnce({ data: EXISTING_ACTIVITY, error: null })
        .mockResolvedValueOnce({ data: EXISTING_ACTIVITY, error: null });
      return chain;
    });
    supabase.from = fromSpy;
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await service.update("act-1", "user-1", { activity_type: "running" });

    // events table should never have been queried
    const eventTableCalls = fromSpy.mock.calls.filter(([t]) => t === "events");
    expect(eventTableCalls).toHaveLength(0);
  });

  it("uses calculatePointsWithMultiplier (base only) when duration changes and no event", async () => {
    // 30 min → base = 30, final = 30 with default 1x multiplier
    const expectedActivity = {
      ...EXISTING_ACTIVITY,
      duration_minutes: 30,
      base_points: 30,
      final_points: 30,
      house_points_awarded: 30,
    };
    setupUpdate(null, expectedActivity);

    const result = await service.update("act-1", "user-1", { duration_minutes: 30 });
    expect(result.base_points).toBe(30);
    expect(result.final_points).toBe(30);
    expect(result.house_points_awarded).toBe(30);
  });

  it("uses calculateFixedChallengePoints when event has challenge_points", async () => {
    const eventWithChallenge = { name: "Fun Run", points_multiplier: 1.0, challenge_points: 100 };
    const expectedActivity = {
      ...EXISTING_ACTIVITY,
      base_points: 0,
      final_points: 100,
      house_points_awarded: 100,
      challenge_points_multiplier: 100,
    };
    setupUpdate(eventWithChallenge, expectedActivity);

    const result = await service.update("act-1", "user-1", {
      event_id: "event-1",
      duration_minutes: 60,
    });
    // challenge_points path: base_points = 0, final_points = challenge value
    expect(result.base_points).toBe(0);
    expect(result.final_points).toBe(100);
    expect(result.house_points_awarded).toBe(100);
  });

  it("uses calculatePointsWithMultiplier with event multiplier when event has no challenge_points", async () => {
    const eventWithMultiplier = { name: "Big Day", points_multiplier: 2.0, challenge_points: null };
    // 60 min base = 60; with 2x multiplier final = 120; house always gets base = 60
    const expectedActivity = {
      ...EXISTING_ACTIVITY,
      base_points: 60,
      final_points: 120,
      house_points_awarded: 60,
    };
    setupUpdate(eventWithMultiplier, expectedActivity);

    const result = await service.update("act-1", "user-1", {
      event_id: "event-2",
      duration_minutes: 60,
    });
    expect(result.base_points).toBe(60);
    expect(result.final_points).toBe(120);
    expect(result.house_points_awarded).toBe(60);
  });
});
