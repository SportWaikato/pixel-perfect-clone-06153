import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityService } from '../services/ActivityService';
import { makeSupabaseMock } from '@/models/__tests__/utils/supabaseMock';

describe('ActivityService — reject and restore', () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: ActivityService;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    service = new ActivityService(supabase as any);
  });

  describe('rejectActivity', () => {
    it('sets is_rejected = true for the given activity ID', async () => {
      supabase._chain.eq = vi.fn().mockResolvedValue({ data: null, error: null });

      await service.rejectActivity('act-1');

      expect(supabase._chain.update).toHaveBeenCalledWith({ is_rejected: true });
      expect(supabase._chain.eq).toHaveBeenCalledWith('id', 'act-1');
    });

    it('throws when the database update fails', async () => {
      supabase._chain.eq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB write failed' },
      });

      await expect(service.rejectActivity('act-1')).rejects.toThrow('DB write failed');
    });
  });

  describe('restoreActivity', () => {
    it('sets is_rejected = false for the given activity ID', async () => {
      supabase._chain.eq = vi.fn().mockResolvedValue({ data: null, error: null });

      await service.restoreActivity('act-1');

      expect(supabase._chain.update).toHaveBeenCalledWith({ is_rejected: false });
      expect(supabase._chain.eq).toHaveBeenCalledWith('id', 'act-1');
    });

    it('throws when the database update fails', async () => {
      supabase._chain.eq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Restore failed' },
      });

      await expect(service.restoreActivity('act-1')).rejects.toThrow('Restore failed');
    });
  });

  describe('rejectActivities (bulk)', () => {
    it('sets is_rejected = true for all provided IDs in one update', async () => {
      supabase._chain.in = vi.fn().mockResolvedValue({ data: null, error: null });

      await service.rejectActivities(['act-1', 'act-2', 'act-3']);

      expect(supabase._chain.update).toHaveBeenCalledWith({ is_rejected: true });
      expect(supabase._chain.in).toHaveBeenCalledWith('id', ['act-1', 'act-2', 'act-3']);
    });

    it('does nothing when given an empty array', async () => {
      await service.rejectActivities([]);

      expect(supabase._chain.update).not.toHaveBeenCalled();
    });

    it('throws when the database update fails', async () => {
      supabase._chain.in = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Bulk reject failed' },
      });

      await expect(service.rejectActivities(['act-1'])).rejects.toThrow('Bulk reject failed');
    });
  });
});
