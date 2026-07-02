import { SupabaseClient } from "@supabase/supabase-js";
import { SchoolMessageInterface } from "../interfaces/SchoolMessageInterface";

const TABLE = "school_messages";

export class SchoolMessageService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getAll(): Promise<SchoolMessageInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .select("*, user:users(first_name, last_name, year_group), school:schools(name)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBySchoolId(schoolId: string): Promise<SchoolMessageInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .select("*, user:users(first_name, last_name, year_group)")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async countUnreadBySchoolId(schoolId: string): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("is_read", false);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await this.supabaseClient.from(TABLE).update({ is_read: true }).eq("id", id);

    if (error) throw new Error(error.message);
  }

  async create(data: { schoolId: string; userId: string; message: string }): Promise<void> {
    const { error } = await this.supabaseClient.from(TABLE).insert({
      school_id: data.schoolId,
      user_id: data.userId,
      message: data.message,
    });

    if (error) throw new Error(error.message);
  }
}
