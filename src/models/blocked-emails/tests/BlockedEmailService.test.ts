import { describe, it, expect, beforeEach } from 'vitest';
import { BlockedEmailService } from '../services/BlockedEmailService';
import { makeSupabaseMock } from '@/models/__tests__/utils/supabaseMock';

const SCHOOL_ID = 'school-1';
const USER_ID = 'user-1';

const makeEntry = (email: string, id = '1') => ({
  id,
  school_id: SCHOOL_ID,
  email,
  note: null,
  created_by: USER_ID,
  created_at: '2024-01-01T00:00:00Z',
});

describe('BlockedEmailService', () => {
  let supabase: ReturnType<typeof makeSupabaseMock>;
  let service: BlockedEmailService;

  beforeEach(() => {
    supabase = makeSupabaseMock();
    service = new BlockedEmailService(supabase as any);
  });

  describe('getBySchoolId', () => {
    it('returns blocked emails for the school', async () => {
      const emails = [makeEntry('bad@school.com', '1'), makeEntry('spam@school.com', '2')];
      supabase._chain.order.mockResolvedValue({ data: emails, error: null });

      const result = await service.getBySchoolId(SCHOOL_ID);

      expect(result).toEqual(emails);
      expect(supabase.from).toHaveBeenCalledWith('blocked_emails');
      expect(supabase._chain.eq).toHaveBeenCalledWith('school_id', SCHOOL_ID);
    });

    it('returns empty array when no blocked emails exist', async () => {
      supabase._chain.order.mockResolvedValue({ data: null, error: null });
      expect(await service.getBySchoolId(SCHOOL_ID)).toEqual([]);
    });

    it('throws on database error', async () => {
      supabase._chain.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      await expect(service.getBySchoolId(SCHOOL_ID)).rejects.toThrow('DB error');
    });
  });

  describe('add', () => {
    it('normalises email to lowercase and trims whitespace', async () => {
      supabase._chain.single.mockResolvedValue({ data: makeEntry('bad@school.com'), error: null });

      await service.add(SCHOOL_ID, '  BAD@School.COM  ', USER_ID);

      const inserted = supabase._chain.upsert.mock.calls[0][0];
      expect(inserted.email).toBe('bad@school.com');
    });

    it('returns the inserted record', async () => {
      const record = makeEntry('bad@school.com');
      supabase._chain.single.mockResolvedValue({ data: record, error: null });

      const result = await service.add(SCHOOL_ID, 'bad@school.com', USER_ID);

      expect(result).toEqual(record);
    });

    it('attaches optional note', async () => {
      supabase._chain.single.mockResolvedValue({ data: makeEntry('bad@school.com'), error: null });

      await service.add(SCHOOL_ID, 'bad@school.com', USER_ID, 'spammer');

      const inserted = supabase._chain.upsert.mock.calls[0][0];
      expect(inserted.note).toBe('spammer');
    });

    it('throws on database error', async () => {
      supabase._chain.single.mockResolvedValue({ data: null, error: { message: 'insert failed' } });
      await expect(service.add(SCHOOL_ID, 'bad@school.com', USER_ID)).rejects.toThrow('insert failed');
    });
  });

  describe('bulkAdd', () => {
    it('normalises emails to lowercase and trims whitespace', async () => {
      supabase._chain.select.mockResolvedValue({ data: [], error: null });

      await service.bulkAdd(SCHOOL_ID, ['  BAD@School.COM  ', 'Spam@school.com'], USER_ID);

      const rows = supabase._chain.upsert.mock.calls[0][0];
      expect(rows).toEqual(expect.arrayContaining([
        expect.objectContaining({ email: 'bad@school.com' }),
        expect.objectContaining({ email: 'spam@school.com' }),
      ]));
    });

    it('deduplicates emails within the input', async () => {
      supabase._chain.select.mockResolvedValue({ data: [], error: null });

      await service.bulkAdd(SCHOOL_ID, ['bad@school.com', 'BAD@school.com', 'bad@school.com'], USER_ID);

      const rows = supabase._chain.upsert.mock.calls[0][0];
      expect(rows).toHaveLength(1);
    });

    it('correctly separates added from skipped (already-blocked) emails', async () => {
      const added = [makeEntry('newbad@school.com', '2')];
      supabase._chain.select.mockResolvedValue({ data: added, error: null });

      const result = await service.bulkAdd(SCHOOL_ID, ['newbad@school.com', 'alreadyblocked@school.com'], USER_ID);

      expect(result.added).toEqual(added);
      expect(result.skipped).toEqual(['alreadyblocked@school.com']);
    });

    it('returns all as added when all emails are new', async () => {
      const added = [makeEntry('a@school.com', '1'), makeEntry('b@school.com', '2')];
      supabase._chain.select.mockResolvedValue({ data: added, error: null });

      const result = await service.bulkAdd(SCHOOL_ID, ['a@school.com', 'b@school.com'], USER_ID);

      expect(result.added).toEqual(added);
      expect(result.skipped).toEqual([]);
    });

    it('attaches optional note to each row', async () => {
      supabase._chain.select.mockResolvedValue({ data: [], error: null });

      await service.bulkAdd(SCHOOL_ID, ['bad@school.com'], USER_ID, 'bulk block');

      const rows = supabase._chain.upsert.mock.calls[0][0];
      expect(rows[0].note).toBe('bulk block');
    });

    it('throws on database error', async () => {
      supabase._chain.select.mockResolvedValue({ data: null, error: { message: 'insert failed' } });
      await expect(service.bulkAdd(SCHOOL_ID, ['bad@school.com'], USER_ID)).rejects.toThrow('insert failed');
    });
  });

  describe('remove', () => {
    it('deletes the entry by id', async () => {
      supabase._chain.eq.mockResolvedValue({ data: null, error: null });

      await service.remove('entry-1');

      expect(supabase._chain.delete).toHaveBeenCalled();
      expect(supabase._chain.eq).toHaveBeenCalledWith('id', 'entry-1');
    });

    it('throws on database error', async () => {
      supabase._chain.eq.mockResolvedValue({ data: null, error: { message: 'delete failed' } });
      await expect(service.remove('entry-1')).rejects.toThrow('delete failed');
    });
  });
});
