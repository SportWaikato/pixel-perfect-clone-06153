import { describe, it, expect, vi } from 'vitest';
import { LeaderboardService } from '../services/LeaderboardService';
import { makeSupabaseMock } from '@/models/__tests__/utils/supabaseMock';

const userId = 'user-1';

const mockUser = {
  id: userId,
  school_rank: 3,
  house_rank: 2,
  year_group_rank: 1,
  overall_rank: 10,
  school: { id: 'school-1', name: 'Test School' },
  house: { id: 'house-1', name: 'Blue House' },
};

const mockRpcData = {
  school_rank: 5,
  school_total_users: 20,
  house_rank: 3,
  house_total_users: 8,
  year_group_rank: 2,
  year_group_total_users: 15,
  overall_rank: 42,
  overall_total_users: 200,
};

function makeService(userResult: object, rpcResult: object) {
  const supabase = makeSupabaseMock();
  supabase.from = vi.fn().mockReturnValue({
    ...supabase._chain,
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(userResult),
  });
  supabase.rpc = vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue(rpcResult),
  });
  return new LeaderboardService(supabase as any);
}

describe('LeaderboardService.getUserRankings', () => {
  it('returns RPC data when RPC succeeds', async () => {
    const service = makeService(
      { data: mockUser, error: null },
      { data: mockRpcData, error: null }
    );
    const result = await service.getUserRankings(userId);

    expect(result?.school_rank).toBe(5);
    expect(result?.overall_rank).toBe(42);
    expect(result?.school_total_users).toBe(20);
  });

  it('falls back to cached user ranks when RPC fails', async () => {
    const service = makeService(
      { data: mockUser, error: null },
      { data: null, error: new Error('RPC timeout') }
    );
    const result = await service.getUserRankings(userId);

    expect(result?.school_rank).toBe(mockUser.school_rank);
    expect(result?.house_rank).toBe(mockUser.house_rank);
  });

  it('fallback returns null for rank fields when cached ranks are null', async () => {
    const userWithNullRanks = { ...mockUser, school_rank: null, house_rank: null, year_group_rank: null, overall_rank: null };
    const service = makeService(
      { data: userWithNullRanks, error: null },
      { data: null, error: new Error('RPC failed') }
    );
    const result = await service.getUserRankings(userId);

    expect(result?.school_rank).toBeNull();
    expect(result?.house_rank).toBeNull();
    expect(result?.overall_rank).toBeNull();
  });

  it('returns null when user query fails', async () => {
    const service = makeService(
      { data: null, error: new Error('User not found') },
      { data: null, error: null }
    );
    const result = await service.getUserRankings(userId);
    expect(result).toBeNull();
  });

  it('fallback uses 0 for total_users (documents known stale-cache behaviour)', async () => {
    const service = makeService(
      { data: mockUser, error: null },
      { data: null, error: new Error('RPC failed') }
    );
    const result = await service.getUserRankings(userId);
    expect(result?.school_total_users).toBe(0);
    expect(result?.overall_total_users).toBe(0);
  });
});
