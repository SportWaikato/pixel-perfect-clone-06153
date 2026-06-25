import { SupabaseClient } from '@supabase/supabase-js';
import { BlockedEmailInterface } from '../interfaces/BlockedEmailInterface';

const TABLE_NAME = 'blocked_emails';

export class BlockedEmailService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getBySchoolId(schoolId: string): Promise<BlockedEmailInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('school_id', schoolId)
      .order('email', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async add(
    schoolId: string,
    email: string,
    createdBy: string,
    note?: string
  ): Promise<BlockedEmailInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .upsert(
        { school_id: schoolId, email: email.trim().toLowerCase(), created_by: createdBy, note: note || null },
        { onConflict: 'school_id,email', ignoreDuplicates: true }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async bulkAdd(
    schoolId: string,
    emails: string[],
    createdBy: string,
    note?: string
  ): Promise<{ added: BlockedEmailInterface[]; skipped: string[] }> {
    const normalised = [...new Set(emails.map(e => e.trim().toLowerCase()))];

    const rows = normalised.map(email => ({
      school_id: schoolId,
      email,
      created_by: createdBy,
      note: note || null,
    }));

    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .upsert(rows, { onConflict: 'school_id,email', ignoreDuplicates: true })
      .select();

    if (error) throw new Error(error.message);

    const added = data || [];
    const addedEmails = new Set(added.map((r: BlockedEmailInterface) => r.email));
    const skipped = normalised.filter(e => !addedEmails.has(e));

    return { added, skipped };
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
