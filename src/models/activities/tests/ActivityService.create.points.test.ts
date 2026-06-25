import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityService } from '../services/ActivityService';
import { makeSupabaseMock } from '@/models/__tests__/utils/supabaseMock';

const DEFAULT_ACTIVITY_RESULT = {
  id: 'act-1',
  user_id: 'user-1',
  created_at: new Date().toISOString(),
  activity_type: 'walking',
  duration_minutes: 60,
  event_id: null,
  participation_type: 'solo',
};

/**
 * Sets up the Supabase mock for ActivityService.create.
 *
 * Activities table: count query resolves via lte (returns 0); insert resolves via single.
 * Events table: returns eventData if provided (simulates an event with points config).
 * All other tables (achievements, users): return the default chain so achievement checks
 * exit early without needing full data wiring.
 */
function setupMock(
  supabase: ReturnType<typeof makeSupabaseMock>,
  { eventData = null }: { eventData?: object | null } = {}
) {
  vi.spyOn(console, 'error').mockImplementation(() => {});

  const insertSpy = vi.fn().mockReturnThis();

  const activitiesChain = {
    ...supabase._chain,
    insert: insertSpy,
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnValue(Promise.resolve({ count: 0, data: null, error: null })),
    single: vi.fn().mockResolvedValue({ data: DEFAULT_ACTIVITY_RESULT, error: null }),
    not: vi.fn().mockReturnThis(),
  };

  const eventsChain = {
    ...supabase._chain,
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: eventData,
      error: eventData ? null : { code: 'PGRST116', message: 'Not found' },
    }),
  };

  supabase.from = vi.fn().mockImplementation((table: string) => {
    if (table === 'activities') return activitiesChain;
    if (table === 'events') return eventsChain;
    return supabase._chain;
  });

  supabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

  return { insertSpy };
}

describe('ActivityService.create — points pipeline', () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: ActivityService;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    service = new ActivityService(supabase as any);
  });

  it('sets base_points = final_points = house_points_awarded = duration_minutes when there is no event', async () => {
    const { insertSpy } = setupMock(supabase);

    await service.create({
      user_id: 'user-1',
      activity_type: 'walking',
      duration_minutes: 60,
      feeling: 'happy',
      participation_type: 'solo',
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        base_points: 60,
        final_points: 60,
        house_points_awarded: 60,
        challenge_points_multiplier: 1.0,
      })
    );
  });

  it('calculates points proportionally for non-round durations (30 min = 30 pts)', async () => {
    const { insertSpy } = setupMock(supabase);

    await service.create({
      user_id: 'user-1',
      activity_type: 'running',
      duration_minutes: 30,
      feeling: 'happy',
      participation_type: 'solo',
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        base_points: 30,
        final_points: 30,
        house_points_awarded: 30,
      })
    );
  });

  it('multiplies final_points by event multiplier but keeps house_points_awarded at base_points', async () => {
    // Critical invariant: houses always earn base points, never multiplier bonuses.
    // If this breaks, every house leaderboard total is silently inflated.
    const { insertSpy } = setupMock(supabase, {
      eventData: { points_multiplier: 2.0, challenge_points: null },
    });

    await service.create({
      user_id: 'user-1',
      activity_type: 'running',
      duration_minutes: 60,
      feeling: 'happy',
      participation_type: 'solo',
      event_id: 'event-1',
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        base_points: 60,
        final_points: 120,        // 60 * 2
        house_points_awarded: 60, // NOT 120 — houses never receive event multipliers
        challenge_points_multiplier: 2.0,
      })
    );
  });

  it('adds challenge_points as a fixed bonus but keeps house_points_awarded at base_points', async () => {
    // Critical invariant: houses always earn base points, never challenge bonuses.
    const { insertSpy } = setupMock(supabase, {
      eventData: { points_multiplier: 1.0, challenge_points: 50 },
    });

    await service.create({
      user_id: 'user-1',
      activity_type: 'cycling',
      duration_minutes: 60,
      feeling: 'happy',
      participation_type: 'solo',
      event_id: 'event-1',
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        base_points: 60,
        final_points: 110,        // 60 + 50
        house_points_awarded: 60, // NOT 110 — houses never receive challenge bonuses
        challenge_points_multiplier: 1.0,
      })
    );
  });

  it('falls back to 1.0 multiplier when event has no points_multiplier set', async () => {
    const { insertSpy } = setupMock(supabase, {
      eventData: { points_multiplier: null, challenge_points: null },
    });

    await service.create({
      user_id: 'user-1',
      activity_type: 'walking',
      duration_minutes: 60,
      feeling: 'happy',
      participation_type: 'solo',
      event_id: 'event-1',
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        base_points: 60,
        final_points: 60,
        house_points_awarded: 60,
        challenge_points_multiplier: 1.0,
      })
    );
  });

  it('calls update_user_streak_for_date RPC after a successful create', async () => {
    setupMock(supabase);

    await service.create({
      user_id: 'user-1',
      activity_type: 'walking',
      duration_minutes: 60,
      feeling: 'happy',
      participation_type: 'solo',
    });

    const streakCall = (supabase.rpc as ReturnType<typeof vi.fn>).mock.calls.find(
      (args: unknown[]) => args[0] === 'update_user_streak_for_date'
    );
    expect(streakCall).toBeDefined();
    expect(streakCall![1]).toMatchObject({ p_user_id: 'user-1' });
  });
});
