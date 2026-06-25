import { SupabaseClient } from '@supabase/supabase-js';
import { SchoolInterface } from '../interfaces/SchoolInterface';

const TABLE_NAME = 'schools';

export class SchoolService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getAll(includeInternal: boolean = false): Promise<SchoolInterface[]> {
    let query = this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('is_active', true);
    
    // Only show non-internal schools by default
    if (!includeInternal) {
      query = query.eq('is_internal', false);
    }
    
    const { data, error } = await query.order('name');

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<SchoolInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async getLeaderboard(includeInternal: boolean = false): Promise<SchoolInterface[]> {
    let query = this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('is_active', true);
    
    if (!includeInternal) {
      query = query.eq('is_internal', false);
    }
    
    const { data, error } = await query
      .order('total_kilometers', { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getPublicSchools(): Promise<SchoolInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('is_active', true)
      .eq('is_internal', false)
      .order('name');

    if (error) throw new Error(error.message);
    return data || [];
  }

  async isInternalSchool(schoolId: string): Promise<boolean> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('is_internal')
      .eq('id', schoolId)
      .single();

    if (error || !data) return false;
    return data.is_internal || false;
  }

  async create(schoolData: Partial<SchoolInterface>): Promise<SchoolInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert({
        name: schoolData.name,
        code: schoolData.code,
        email_domain: schoolData.email_domain || null,
        is_active: schoolData.is_active ?? true,
        is_internal: schoolData.is_internal ?? false,
        registration_method: schoolData.registration_method ?? 'domain_blocklist',
        total_students: 0,
        total_kilometers: 0,
        total_points: 0
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, schoolData: Partial<SchoolInterface>): Promise<SchoolInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        name: schoolData.name,
        code: schoolData.code,
        email_domain: schoolData.email_domain || null,
        is_active: schoolData.is_active,
        is_internal: schoolData.is_internal,
        registration_method: schoolData.registration_method
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<void> {
    // Check if school has any students first
    const { count } = await this.supabaseClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', id);

    if (count && count > 0) {
      throw new Error('Cannot delete school with existing students. Please reassign or remove students first.');
    }

    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async getAllWithStats(includeInternal: boolean = true): Promise<SchoolInterface[]> {
    let query = this.supabaseClient
      .from(TABLE_NAME)
      .select('*, houses(total_points)');

    if (!includeInternal) {
      query = query.eq('is_internal', false);
    }

    const { data, error } = await query.order('name');

    if (error) throw new Error(error.message);

    return (data || []).map((school: any) => {
      const { houses, ...schoolData } = school;
      return {
        ...schoolData,
        total_points: (houses as { total_points: number }[] || []).reduce(
          (sum, h) => sum + (h.total_points || 0), 0
        ),
      };
    });
  }
} 