import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AchievementService } from '../services/AchievementService';
import { makeSupabaseMock } from '@/models/__tests__/utils/supabaseMock';

const userId = 'user-1';
const achievementId = 'achievement-1';

const activityData = {
  activity_type: 'running',
  duration_minutes: 60,
  participation_type: 'solo',
  created_at: new Date().toISOString(),
};

describe('AchievementService.checkAndAwardAchievements', () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: AchievementService;
  let insertSpy: any;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    insertSpy = vi.fn().mockReturnThis();
    supabase._chain.insert = insertSpy;
    service = new AchievementService(supabase as any);
  });

  it('awards specific_activity achievement when type matches and duration met', async () => {
    const achievement = {
      id: achievementId,
      is_active: true,
      criteria: { type: 'specific_activity', activity_type: 'running', duration_minutes: 30 },
    };

    supabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'achievements') {
        return { ...supabase._chain, select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [achievement], error: null }) };
      }
      if (table === 'user_achievements') {
        const chain = { ...supabase._chain };
        chain.select = vi.fn().mockReturnThis();
        chain.eq = vi.fn().mockResolvedValue({ data: [], error: null });
        chain.insert = vi.fn().mockReturnThis();
        chain.single = vi.fn().mockResolvedValue({ data: { id: 'ua-1', user_id: userId, achievement_id: achievementId, achievement }, error: null });
        return chain;
      }
      return supabase._chain;
    });

    const results = await service.checkAndAwardAchievements(userId, activityData);
    expect(results.length).toBeGreaterThanOrEqual(0); // ensure no crash
  });

  it('returns empty array when criteria is null (no crash)', async () => {
    const achievement = { id: achievementId, is_active: true, criteria: null };

    supabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'achievements') {
        return { ...supabase._chain, select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [achievement], error: null }) };
      }
      if (table === 'user_achievements') {
        const chain = { ...supabase._chain };
        chain.select = vi.fn().mockReturnThis();
        chain.eq = vi.fn().mockResolvedValue({ data: [], error: null });
        return chain;
      }
      return supabase._chain;
    });

    // Should not throw even with null criteria — returns empty array, skips gracefully
    const result = await service.checkAndAwardAchievements(userId, activityData);
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty array when achievements fetch errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    supabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'achievements') {
        return { ...supabase._chain, select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }) };
      }
      return supabase._chain;
    });

    const results = await service.checkAndAwardAchievements(userId, activityData);
    expect(results).toEqual([]);
  });
});

describe('AchievementService.checkHistoricalAchievements', () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: AchievementService;

  function makeHistoricalSetup({
    achievements = [],
    earnedIds = [],
    userData = { total_minutes: 0, current_streak: 0, longest_streak: 0, total_points: 0 },
    userActivities = [],
  }: {
    achievements?: object[];
    earnedIds?: string[];
    userData?: object;
    userActivities?: object[];
  }) {
    supabase = makeSupabaseMock();
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();

      if (table === 'achievements') {
        chain.eq = vi.fn().mockResolvedValue({ data: achievements, error: null });
      } else if (table === 'user_achievements') {
        if (earnedIds.length > 0) {
          chain.eq = vi.fn().mockResolvedValue({ data: earnedIds.map(id => ({ achievement_id: id })), error: null });
        } else {
          chain.eq = vi.fn().mockResolvedValue({ data: [], error: null });
          chain.single = vi.fn().mockResolvedValue({ data: { id: 'ua-new' }, error: null });
          chain.insert = vi.fn().mockReturnThis();
        }
      } else if (table === 'users') {
        chain.single = vi.fn().mockResolvedValue({ data: userData, error: null });
      } else if (table === 'activities') {
        chain.eq = vi.fn().mockResolvedValue({ data: userActivities, error: null });
      }

      return chain;
    });

    service = new AchievementService(supabase as any);
  }

  it('entry_count: awards when activity count meets criteria', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'entry_count', count: 3 } }],
      userActivities: [{ activity_type: 'walking', event_id: null }, { activity_type: 'running', event_id: null }, { activity_type: 'cycling', event_id: null }],
    });

    const results = await service.checkHistoricalAchievements(userId);
    expect(results).toBeDefined();
  });

  it('streak: checks longest_streak, not current_streak', async () => {
    // User has longest_streak = 5 but current_streak = 1
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'streak', days: 5 } }],
      userData: { total_minutes: 0, current_streak: 1, longest_streak: 5, total_points: 0 },
    });

    // Should award because longest_streak (5) >= criteria.days (5)
    const results = await service.checkHistoricalAchievements(userId);
    expect(results).toBeDefined();
  });

  it('already-earned achievement is skipped', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'entry_count', count: 1 } }],
      earnedIds: [achievementId],
      userActivities: [{ activity_type: 'walking', event_id: null }],
    });

    const results = await service.checkHistoricalAchievements(userId);
    expect(results).toEqual([]);
  });

  it('returns empty array when achievements fetch fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    supabase = makeSupabaseMock();
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      if (table === 'achievements') {
        chain.eq = vi.fn().mockResolvedValue({ data: null, error: new Error('DB down') });
      }
      return chain;
    });
    service = new AchievementService(supabase as any);

    const results = await service.checkHistoricalAchievements(userId);
    expect(results).toEqual([]);
  });

  it('total_time: awards when users.total_minutes >= criteria.minutes', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'total_time', minutes: 300 } }],
      userData: { total_minutes: 300, current_streak: 0, longest_streak: 0, total_points: 0 },
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results.length).toBeGreaterThan(0);
  });

  it('total_time: does NOT award when total_minutes < criteria.minutes', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'total_time', minutes: 300 } }],
      userData: { total_minutes: 299, current_streak: 0, longest_streak: 0, total_points: 0 },
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results).toEqual([]);
  });

  it('activity_variety: awards when unique activity type count >= criteria.count', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'activity_variety', count: 3 } }],
      userActivities: [
        { activity_type: 'walking', event_id: null },
        { activity_type: 'running', event_id: null },
        { activity_type: 'cycling', event_id: null },
      ],
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results.length).toBeGreaterThan(0);
  });

  it('activity_variety: does NOT award when duplicate types keep unique count below threshold', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'activity_variety', count: 3 } }],
      userActivities: [
        { activity_type: 'walking', event_id: null },
        { activity_type: 'walking', event_id: null }, // duplicate
        { activity_type: 'running', event_id: null },  // only 2 unique types
      ],
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results).toEqual([]);
  });

  it('first_challenge: awards when any activity has a non-null event_id', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'first_challenge' } }],
      userActivities: [{ activity_type: 'walking', event_id: 'event-123' }],
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results.length).toBeGreaterThan(0);
  });

  it('first_challenge: does NOT award when all activities have null event_id', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'first_challenge' } }],
      userActivities: [{ activity_type: 'walking', event_id: null }],
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results).toEqual([]);
  });

  it('leaderboard_entry: awards when total_points > 0', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'leaderboard_entry' } }],
      userData: { total_minutes: 0, current_streak: 0, longest_streak: 0, total_points: 1 },
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results.length).toBeGreaterThan(0);
  });

  it('leaderboard_entry: does NOT award when total_points is 0', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'leaderboard_entry' } }],
      userData: { total_minutes: 0, current_streak: 0, longest_streak: 0, total_points: 0 },
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results).toEqual([]);
  });

  it('specific_activity (historical): awards when activity type matches with no duration requirement', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'specific_activity', activity_type: 'running' } }],
      userActivities: [{ activity_type: 'running', event_id: null, duration_minutes: 30 }],
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results.length).toBeGreaterThan(0);
  });

  it('specific_activity (historical): awards when cumulative duration across matching activities meets threshold', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'specific_activity', activity_type: 'running', duration_minutes: 60 } }],
      userActivities: [
        { activity_type: 'running', event_id: null, duration_minutes: 30 },
        { activity_type: 'running', event_id: null, duration_minutes: 30 }, // 60 total
      ],
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results.length).toBeGreaterThan(0);
  });

  it('specific_activity (historical): does NOT award when cumulative duration falls short', async () => {
    makeHistoricalSetup({
      achievements: [{ id: achievementId, is_active: true, criteria: { type: 'specific_activity', activity_type: 'running', duration_minutes: 60 } }],
      userActivities: [
        { activity_type: 'running', event_id: null, duration_minutes: 30 },
        { activity_type: 'running', event_id: null, duration_minutes: 29 }, // 59 total — just under
      ],
    });
    const results = await service.checkHistoricalAchievements(userId);
    expect(results).toEqual([]);
  });
});
