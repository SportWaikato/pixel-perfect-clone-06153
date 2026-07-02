import { SupabaseClient } from "@supabase/supabase-js";
import { SuperAdminInviteInterface } from "../interfaces/SuperAdminInviteInterface";

const TABLE_NAME = "super_admin_invites";

export class InviteService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async create(email: string, createdById: string): Promise<SuperAdminInviteInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert({ email, created_by: createdById })
      .select()
      .single();

    if (error || !data) throw error || new Error("Failed to create invite");
    return data;
  }

  async list(): Promise<SuperAdminInviteInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async revoke(id: string): Promise<void> {
    const { error } = await this.supabaseClient.from(TABLE_NAME).delete().eq("id", id);

    if (error) throw error;
  }
}
