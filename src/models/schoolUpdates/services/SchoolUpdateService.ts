import { SupabaseClient } from "@supabase/supabase-js";
import { SchoolUpdateInterface } from "../interfaces/SchoolUpdateInterface";

const TABLE = "school_updates";
const READS_TABLE = "school_update_reads";

export class SchoolUpdateService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getAll(limit = 50): Promise<SchoolUpdateInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .select("*, school:schools(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBySchoolId(schoolId: string, limit = 30): Promise<SchoolUpdateInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getWithReadStatus(
    schoolId: string,
    userId: string,
    limit = 20,
  ): Promise<SchoolUpdateInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .select(`*, school_update_reads!left(user_id)`)
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
      ...row,
      is_read: Array.isArray(row.school_update_reads)
        ? row.school_update_reads.some((r: any) => r.user_id === userId)
        : false,
      school_update_reads: undefined,
    }));
  }

  async getUnreadCount(schoolId: string, userId: string): Promise<number> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .select(`id, school_update_reads!left(user_id)`)
      .eq("school_id", schoolId)
      .eq("is_active", true);

    if (error) return 0;

    return (data || []).filter((row: any) => {
      const reads = Array.isArray(row.school_update_reads) ? row.school_update_reads : [];
      return !reads.some((r: any) => r.user_id === userId);
    }).length;
  }

  async create(data: {
    schoolId: string;
    createdBy: string;
    title: string;
    body?: string;
    imageUrl?: string;
    imageStoragePath?: string;
  }): Promise<SchoolUpdateInterface> {
    const { data: created, error } = await this.supabaseClient
      .from(TABLE)
      .insert({
        school_id: data.schoolId,
        created_by: data.createdBy,
        title: data.title,
        body: data.body || null,
        image_url: data.imageUrl || null,
        image_storage_path: data.imageStoragePath || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created;
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(TABLE)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async markAllAsRead(schoolId: string, userId: string): Promise<void> {
    const updates = await this.getBySchoolId(schoolId);
    if (updates.length === 0) return;

    const rows = updates.map((u) => ({ update_id: u.id, user_id: userId }));

    const { error } = await this.supabaseClient
      .from(READS_TABLE)
      .upsert(rows, { onConflict: "update_id,user_id", ignoreDuplicates: true });

    if (error) throw new Error(error.message);
  }
}
