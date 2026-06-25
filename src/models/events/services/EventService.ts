import { SupabaseClient } from '@supabase/supabase-js';
import { EventInterface } from '../interfaces/EventInterface';
import { UserInterface } from '@/models/users/interfaces/UserInterface';

const TABLE_NAME = 'events';

export class EventService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getAll(): Promise<EventInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<EventInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async createPendingEvent(eventData: Partial<EventInterface>, createdBy: string): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert({
        ...eventData,
        created_by: createdBy,
        approval_status: 'pending',
        participant_count: 0,
        is_active: false, // Inactive until approved
        is_student_suggested: true,
        youtube_video_url: eventData.youtube_video_url || null,
        target_schools: eventData.target_schools ?? null,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async createApprovedEvent(eventData: Partial<EventInterface>, createdBy: string): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert({
        ...eventData,
        created_by: createdBy,
        approval_status: 'approved',
        participant_count: 0,
        is_active: true,
        is_published: true,
        last_interaction_at: new Date().toISOString(),
        youtube_video_url: eventData.youtube_video_url || null,
        target_schools: eventData.target_schools ?? null,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getPendingEventsForSchool(schoolId: string): Promise<EventInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        creator:users!events_created_by_fkey(username, first_name, last_name)
      `)
      .eq('approval_status', 'pending')
      .contains('target_schools', [schoolId])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAllPendingEvents(): Promise<EventInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        creator:users!events_created_by_fkey(username, first_name, last_name)
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async approveEvent(eventId: string, approverId: string): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        approval_status: 'approved',
        is_active: true,
        is_published: true,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async rejectEvent(eventId: string, approverId: string): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        approval_status: 'rejected',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getApprovedEvents(options?: { viewerRole?: UserInterface['role']; viewerSchoolId?: string | null }): Promise<EventInterface[]> {
    const isAdmin = options?.viewerRole === 'school_admin' || options?.viewerRole === 'super_admin';

    let query = this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        badge:achievements(
          id,
          name,
          description,
          icon_name,
          image_filename,
          points_reward
        )
      `)
      .eq('approval_status', 'approved')
      .eq('is_active', true);

    // Students only see published events; admins see all approved events so they
    // can manage publish state.
    if (!isAdmin) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.order('start_date', { ascending: true });

    if (error) throw new Error(error.message);
    const events = data || [];

    if (options?.viewerRole === 'super_admin') {
      return events;
    }

    const viewerSchoolId = options?.viewerSchoolId;

    if (!viewerSchoolId) {
      return events.filter(event => !event.target_schools || event.target_schools.length === 0);
    }

    return events.filter(event => {
      if (!event.target_schools || event.target_schools.length === 0) {
        return true;
      }

      return event.target_schools.includes(viewerSchoolId);
    });
  }

  async joinEvent(eventId: string, userId: string): Promise<void> {
    // Check if user is already a participant
    const { data: existing } = await this.supabaseClient
      .from('event_participants')
      .select('id, is_active')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // If exists but inactive, reactivate
      if (!existing.is_active) {
        const { error } = await this.supabaseClient
          .from('event_participants')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        if (error) throw new Error(error.message);
      }
    } else {
      // Create new participation record
      const { error } = await this.supabaseClient
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          is_active: true,
          total_distance: 0,
          total_points: 0,
        });

      if (error) throw new Error(error.message);
    }
  }

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    // Set participation to inactive instead of deleting
    const { error } = await this.supabaseClient
      .from('event_participants')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  async getUserEventParticipation(userId: string): Promise<string[]> {
    const { data, error } = await this.supabaseClient
      .from('event_participants')
      .select('event_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw new Error(error.message);
    return (data || []).map(p => p.event_id);
  }

  async getEventWithBadge(eventId: string): Promise<EventInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(`
        *,
        badge:achievements(
          id,
          name,
          description,
          icon_name,
          image_filename,
          points_reward
        )
      `)
      .eq('id', eventId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching event with badge:', error);
      return null;
    }

    return data;
  }

  async updateEvent(eventId: string, eventData: Partial<EventInterface>): Promise<EventInterface> {
    const { error: updateError } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        ...eventData,
        youtube_video_url: eventData.youtube_video_url,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (updateError) throw new Error(updateError.message);

    const { data, error: fetchError } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    return data;
  }

  async publishEvent(eventId: string): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        is_published: true,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async unpublishEvent(eventId: string): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        is_active: false,
        approval_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw new Error(error.message);
  }

  async getAssemblyEvent(schoolId: string): Promise<EventInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('is_assembly', true)
      .eq('is_active', true)
      .eq('is_published', true)
      .eq('approval_status', 'approved')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return null;

    const visible = data.find(event => {
      if (!event.target_schools || event.target_schools.length === 0) return true;
      return event.target_schools.includes(schoolId);
    });

    return visible || null;
  }

  async getPendingCountForSchool(schoolId: string): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending')
      .contains('target_schools', [schoolId]);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async getAllPendingCount(): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    if (error) throw new Error(error.message);
    return count || 0;
  }
}
