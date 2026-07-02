import { SupabaseClient } from "@supabase/supabase-js";
import { HouseInterface } from "../interfaces/HouseInterface";

const TABLE_NAME = "houses";

export class HouseService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getAll(): Promise<HouseInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .order("total_points", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBySchoolId(schoolId: string): Promise<HouseInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .eq("school_id", schoolId)
      .order("total_points", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getLeaderboard(): Promise<HouseInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .order("total_points", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<HouseInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      throw new Error(error.message);
    }
    return data;
  }

  async create(house: Partial<HouseInterface>): Promise<HouseInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert({
        name: house.name,
        color: house.color,
        school_id: house.school_id,
        total_points: 0,
        total_kilometers: 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, updates: Partial<HouseInterface>): Promise<HouseInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        name: updates.name,
        color: updates.color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseClient.from(TABLE_NAME).delete().eq("id", id);

    if (error) throw new Error(error.message);
  }

  async countBySchoolId(schoolId: string): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async checkNameExists(name: string, schoolId: string, excludeId?: string): Promise<boolean> {
    let query = this.supabaseClient
      .from(TABLE_NAME)
      .select("id")
      .eq("name", name)
      .eq("school_id", schoolId);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return (data?.length || 0) > 0;
  }
}
