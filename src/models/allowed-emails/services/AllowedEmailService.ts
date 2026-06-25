import { SupabaseClient } from '@supabase/supabase-js';
import { AllowedEmailInterface } from '../interfaces/AllowedEmailInterface';

const TABLE_NAME = 'allowed_emails';

export class AllowedEmailService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getAll(): Promise<AllowedEmailInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .order('email', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBySchoolId(schoolId: string): Promise<AllowedEmailInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('school_id', schoolId)
      .order('email', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async bulkAdd(
    schoolId: string,
    emails: string[],
    createdBy: string,
    note?: string
  ): Promise<{ added: AllowedEmailInterface[]; skipped: string[] }> {
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
    const addedEmails = new Set(added.map((r: AllowedEmailInterface) => r.email));
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

  async isAllowed(schoolId: string, email: string): Promise<boolean> {
    const { data, error } = await this.supabaseClient
      .rpc('is_email_allowed', { p_school_id: schoolId, p_email: email });

    if (error) return false;
    return data === true;
  }

}
