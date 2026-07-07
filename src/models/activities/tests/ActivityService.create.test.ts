import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActivityService } from "../services/ActivityService";
import { makeSupabaseMock } from "@/models/__tests__/utils/supabaseMock";
import {
  MAX_ACTIVITY_DURATION_MINUTES,
  MAX_ACTIVITY_DAYS_AGO,
  MAX_ACTIVITY_MINUTES_PER_DAY,
} from "../constants/activityValidationConstants";

const LIMIT_ERROR_FRAGMENT = "Something isn't right";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const baseActivity = {
  user_id: "user-1",
  activity_type: "walking",
  duration_minutes: 60,
  feeling: "happy" as const,
  participation_type: "solo" as const,
};

describe("ActivityService.create — validation rules", () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: ActivityService;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    // Default: 0 activities today (count query returns 0)
    supabase._chain.select.mockReturnThis();
    supabase._chain.single.mockResolvedValue({ data: null, error: null });
    // Mock the count query to return count: 0
    const countResult = Promise.resolve({ count: 0, data: null, error: null });
    supabase._chain.lte = vi.fn().mockReturnValue(countResult);

    service = new ActivityService(supabase as any);
  });

  it("throws when duration exceeds MAX_ACTIVITY_DURATION_MINUTES", async () => {
    await expect(
      service.create({ ...baseActivity, duration_minutes: MAX_ACTIVITY_DURATION_MINUTES + 1 }),
    ).rejects.toThrow(LIMIT_ERROR_FRAGMENT);
  });

  it("does not throw at exactly MAX_ACTIVITY_DURATION_MINUTES (boundary)", async () => {
    // Mock the full create path returning a valid activity
    supabase._chain.lte = vi
      .fn()
      .mockReturnValue(Promise.resolve({ count: 0, data: null, error: null }));
    supabase._chain.single.mockResolvedValue({
      data: {
        ...baseActivity,
        duration_minutes: MAX_ACTIVITY_DURATION_MINUTES,
        id: "1",
        created_at: new Date().toISOString(),
      },
      error: null,
    });
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    // Should not throw on duration validation (may fail later on insert mock — that's fine)
    await expect(
      service.create({ ...baseActivity, duration_minutes: MAX_ACTIVITY_DURATION_MINUTES }),
    ).resolves.toBeDefined();
  });

  it("throws when created_at is older than MAX_ACTIVITY_DAYS_AGO", async () => {
    const tooOld = daysAgo(MAX_ACTIVITY_DAYS_AGO + 1);
    await expect(service.create({ ...baseActivity, created_at: tooOld })).rejects.toThrow(
      LIMIT_ERROR_FRAGMENT,
    );
  });

  it("does not throw when created_at is exactly MAX_ACTIVITY_DAYS_AGO days ago (boundary)", async () => {
    supabase._chain.lte = vi
      .fn()
      .mockReturnValue(Promise.resolve({ count: 0, data: null, error: null }));
    supabase._chain.single.mockResolvedValue({
      data: { ...baseActivity, id: "1", created_at: daysAgo(MAX_ACTIVITY_DAYS_AGO) },
      error: null,
    });
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await expect(
      service.create({ ...baseActivity, created_at: daysAgo(MAX_ACTIVITY_DAYS_AGO) }),
    ).resolves.toBeDefined();
  });

  it("allows multiple entries in a day when the daily minute cap is not exceeded", async () => {
    supabase._chain.lte = vi.fn().mockReturnValue(
      Promise.resolve({
        data: [{ duration_minutes: 180 }, { duration_minutes: 120 }, { duration_minutes: 60 }],
        error: null,
      }),
    );
    supabase._chain.single.mockResolvedValue({
      data: { ...baseActivity, id: "1", created_at: new Date().toISOString() },
      error: null,
    });
    supabase.rpc.mockResolvedValue({ data: null, error: null });
    service = new ActivityService(supabase as any);

    await expect(service.create(baseActivity)).resolves.toBeDefined();
  });

  it(`throws when daily minutes would exceed ${MAX_ACTIVITY_MINUTES_PER_DAY}`, async () => {
    supabase._chain.lte = vi.fn().mockReturnValue(
      Promise.resolve({
        data: [{ duration_minutes: MAX_ACTIVITY_MINUTES_PER_DAY - 30 }],
        error: null,
      }),
    );
    service = new ActivityService(supabase as any);

    await expect(service.create(baseActivity)).rejects.toThrow(LIMIT_ERROR_FRAGMENT);
  });

  it("throws when duration_minutes is missing", async () => {
    supabase._chain.lte = vi
      .fn()
      .mockReturnValue(Promise.resolve({ count: 0, data: null, error: null }));
    service = new ActivityService(supabase as any);

    await expect(service.create({ ...baseActivity, duration_minutes: 0 })).rejects.toThrow(
      "Duration in minutes is required",
    );
  });
});
