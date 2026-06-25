import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityService } from '../services/ActivityService';
import { makeSupabaseMock } from '@/models/__tests__/utils/supabaseMock';

const EXISTING_ACTIVITY = {
  id: 'act-1',
  user_id: 'user-1',
  activity_type: 'walking',
  duration_minutes: 60,
  created_at: new Date().toISOString(),
  is_rejected: false,
};

describe('ActivityService.delete — ownership and cascade', () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: ActivityService;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    service = new ActivityService(supabase as any);
  });

  it('throws "Activity not found" when activity does not exist', async () => {
    supabase._chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
    await expect(service.delete('act-1', 'user-1')).rejects.toThrow('Activity not found');
  });

  it('throws "You can only delete your own activities" when user_id does not match', async () => {
    supabase._chain.single.mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
    await expect(service.delete('act-1', 'user-2')).rejects.toThrow('You can only delete your own activities');
  });

  it('throws when the database delete itself fails', async () => {
    let activitiesCallCount = 0;
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.delete = vi.fn().mockReturnThis();

      if (table === 'activities') {
        activitiesCallCount++;
        if (activitiesCallCount === 1) {
          // getById
          chain.single = vi.fn().mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
        } else {
          // delete
          chain.eq = vi.fn().mockResolvedValue({ data: null, error: new Error('Delete failed') });
        }
      }
      return chain;
    });
    service = new ActivityService(supabase as any);

    await expect(service.delete('act-1', 'user-1')).rejects.toThrow('Delete failed');
  });

  it('calls recalculateUserTotals for the correct user after successful delete', async () => {
    let activitiesCallCount = 0;
    const recalculateSpy = vi.spyOn(ActivityService.prototype as any, 'recalculateUserTotals').mockResolvedValue(undefined);

    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.delete = vi.fn().mockReturnThis();

      if (table === 'activities') {
        activitiesCallCount++;
        if (activitiesCallCount === 1) {
          chain.single = vi.fn().mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
        } else {
          chain.eq = vi.fn().mockResolvedValue({ data: null, error: null });
        }
      }
      return chain;
    });
    supabase.rpc.mockResolvedValue({ data: null, error: null });
    service = new ActivityService(supabase as any);

    await service.delete('act-1', 'user-1');
    expect(recalculateSpy).toHaveBeenCalledWith('user-1');

    recalculateSpy.mockRestore();
  });

  it('calls update_user_streak_for_date RPC after successful delete', async () => {
    // Spy on recalculateUserTotals so we don't need to wire up the full two-.eq() chain it uses
    const recalculateSpy = vi.spyOn(ActivityService.prototype as any, 'recalculateUserTotals').mockResolvedValue(undefined);

    let activitiesCallCount = 0;
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.delete = vi.fn().mockReturnThis();

      if (table === 'activities') {
        activitiesCallCount++;
        if (activitiesCallCount === 1) {
          chain.single = vi.fn().mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
        } else {
          chain.eq = vi.fn().mockResolvedValue({ data: null, error: null });
        }
      }
      return chain;
    });
    supabase.rpc.mockResolvedValue({ data: null, error: null });
    service = new ActivityService(supabase as any);

    await service.delete('act-1', 'user-1');

    const streakCall = (supabase.rpc as ReturnType<typeof vi.fn>).mock.calls.find(
      ([name]) => name === 'update_user_streak_for_date'
    );
    expect(streakCall).toBeDefined();
    expect(streakCall![1]).toMatchObject({ p_user_id: 'user-1' });

    recalculateSpy.mockRestore();
  });

  it('does NOT throw when recalculate or streak RPC fails (errors are swallowed)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let activitiesCallCount = 0;

    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = { ...supabase._chain };
      chain.select = vi.fn().mockReturnThis();
      chain.eq = vi.fn().mockReturnThis();
      chain.delete = vi.fn().mockReturnThis();

      if (table === 'activities') {
        activitiesCallCount++;
        if (activitiesCallCount === 1) {
          chain.single = vi.fn().mockResolvedValue({ data: EXISTING_ACTIVITY, error: null });
        } else {
          chain.eq = vi.fn().mockResolvedValue({ data: null, error: null });
        }
      } else if (table === 'users') {
        // Simulate recalculate failure
        chain.eq = vi.fn().mockResolvedValue({ data: null, error: new Error('DB down') });
      }
      return chain;
    });
    supabase.rpc.mockRejectedValue(new Error('RPC failed'));
    service = new ActivityService(supabase as any);

    // Should resolve without throwing even though cascade calls fail
    await expect(service.delete('act-1', 'user-1')).resolves.toBeUndefined();
  });
});
