import { SupabaseClient } from "@supabase/supabase-js";
import { EventInterface, ChallengeProgress } from "../interfaces/EventInterface";
import { UserInterface } from "@/models/users/interfaces/UserInterface";

const TABLE_NAME = "events";

export class EventService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getAll(): Promise<EventInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .eq("is_active", true)
      .order("start_date", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<EventInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async createPendingEvent(
    eventData: Partial<EventInterface>,
    createdBy: string,
  ): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert({
        ...eventData,
        created_by: createdBy,
        approval_status: "pending",
        participant_count: 0,
        is_active: false, // Inactive until approved
        is_student_suggested: true,
        youtube_video_url: eventData.youtube_video_url || null,
        target_schools: eventData.target_schools ?? null,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async createApprovedEvent(
    eventData: Partial<EventInterface>,
    createdBy: string,
  ): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert({
        ...eventData,
        created_by: createdBy,
        approval_status: "approved",
        participant_count: 0,
        is_active: true,
        is_published: true,
        last_interaction_at: new Date().toISOString(),
        youtube_video_url: eventData.youtube_video_url || null,
        target_schools: eventData.target_schools ?? null,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getPendingEventsForSchool(schoolId: string): Promise<EventInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        creator:users!events_created_by_fkey(username, first_name, last_name)
      `,
      )
      .eq("approval_status", "pending")
      .contains("target_schools", [schoolId])
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAllPendingEvents(): Promise<EventInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        creator:users!events_created_by_fkey(username, first_name, last_name)
      `,
      )
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async approveEvent(eventId: string, approverId: string): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        approval_status: "approved",
        is_active: true,
        is_published: true,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async rejectEvent(eventId: string, approverId: string): Promise<EventInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        approval_status: "rejected",
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getApprovedEvents(options?: {
    viewerRole?: UserInterface["role"];
    viewerSchoolId?: string | null;
  }): Promise<EventInterface[]> {
    const isAdmin = options?.viewerRole === "school_admin" || options?.viewerRole === "super_admin";

    let query = this.supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        badge:achievements(
          id,
          name,
          description,
          icon_name,
          image_filename,
          points_reward
        )
      `,
      )
      .eq("approval_status", "approved")
      .eq("is_active", true);

    // Students only see published events; admins see all approved events so they
    // can manage publish state.
    if (!isAdmin) {
      query = query.eq("is_published", true);
    }

    const { data, error } = await query.order("start_date", { ascending: true });

    if (error) throw new Error(error.message);
    const events = data || [];

    if (options?.viewerRole === "super_admin") {
      return events;
    }

    const viewerSchoolId = options?.viewerSchoolId;

    if (!viewerSchoolId) {
      return events.filter((event) => !event.target_schools || event.target_schools.length === 0);
    }

    return events.filter((event) => {
      if (!event.target_schools || event.target_schools.length === 0) {
        return true;
      }

      return event.target_schools.includes(viewerSchoolId);
    });
  }

  async joinEvent(eventId: string, userId: string): Promise<void> {
    // Check if user is already a participant
    const { data: existing } = await this.supabaseClient
      .from("event_participants")
      .select("id, is_active")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      // If exists but inactive, reactivate
      if (!existing.is_active) {
        const { error } = await this.supabaseClient
          .from("event_participants")
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (error) throw new Error(error.message);
      }
    } else {
      // Create new participation record
      const { error } = await this.supabaseClient.from("event_participants").insert({
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
      .from("event_participants")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  async getUserEventParticipation(userId: string): Promise<string[]> {
    const { data, error } = await this.supabaseClient
      .from("event_participants")
      .select("event_id")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) throw new Error(error.message);
    return (data || []).map((p) => p.event_id);
  }

  async getEventWithBadge(eventId: string): Promise<EventInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select(
        `
        *,
        badge:achievements(
          id,
          name,
          description,
          icon_name,
          image_filename,
          points_reward
        )
      `,
      )
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching event with badge:", error);
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
      .eq("id", eventId);

    if (updateError) throw new Error(updateError.message);

    const { data, error: fetchError } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .eq("id", eventId)
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
      .eq("id", eventId)
      .select("*")
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
      .eq("id", eventId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        is_active: false,
        approval_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (error) throw new Error(error.message);
  }

  async getAssemblyEvent(schoolId: string): Promise<EventInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .eq("is_assembly", true)
      .eq("is_active", true)
      .eq("is_published", true)
      .eq("approval_status", "approved")
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return null;

    const visible = data.find((event) => {
      if (!event.target_schools || event.target_schools.length === 0) return true;
      return event.target_schools.includes(schoolId);
    });

    return visible || null;
  }

  async getPendingCountForSchool(schoolId: string): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "pending")
      .contains("target_schools", [schoolId]);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async getAllPendingCount(): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "pending");

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async getEventsCreatedByUser(userId: string): Promise<EventInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBySchoolId(schoolId: string): Promise<EventInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .contains("target_schools", [schoolId])
      .order("start_date", { ascending: true });

    if (error) {
      const { data: allData, error: allError } = await this.supabaseClient
        .from(TABLE_NAME)
        .select("*")
        .order("start_date", { ascending: true });

      if (allError) throw new Error(allError.message);

      return (allData || []).filter(
        (e: EventInterface) =>
          !e.target_schools || e.target_schools.length === 0 || e.target_schools.includes(schoolId),
      );
    }
    return data || [];
  }

  async getUserChallengeProgress(
    eventId: string,
    userId: string,
  ): Promise<ChallengeProgress | null> {
    const event = await this.getById(eventId);
    if (!event) return null;

    const completionType = event.completion_type || "minutes_total";
    const targetMinutes = event.target_minutes || 0;
    const targetSessions = event.target_sessions || 1;
    const targetDays = event.target_days || 1;
    const requiredTag = event.required_tag;

    const { data: activities } = await this.supabaseClient
      .from("activities")
      .select("duration_minutes, activity_type, participation_type, created_at")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .eq("is_rejected", false)
      .gte("created_at", event.start_date)
      .lte("created_at", event.end_date);

    if (!activities) {
      return {
        challenge_id: eventId,
        user_id: userId,
        school_id: event.target_schools?.[0] || "",
        progress_value: 0,
        target_value: 0,
        completed: false,
      };
    }

    let progressValue = 0;
    let targetValue = 0;
    let completed = false;

    switch (completionType) {
      case "minutes_total": {
        const taggedActs = requiredTag
          ? activities.filter((a) => a.participation_type === requiredTag)
          : activities;
        progressValue = taggedActs.reduce((s, a) => s + (a.duration_minutes || 0), 0);
        targetValue = targetMinutes;
        completed = progressValue >= targetValue;
        break;
      }
      case "minutes_daily": {
        const dailyMap = new Map<string, number>();
        for (const a of activities) {
          if (requiredTag && a.participation_type !== requiredTag) continue;
          const day = a.created_at.split("T")[0];
          dailyMap.set(day, (dailyMap.get(day) || 0) + (a.duration_minutes || 0));
        }
        const totalDays =
          Math.ceil(
            (new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;
        progressValue = Array.from(dailyMap.values()).filter((m) => m >= targetMinutes).length;
        targetValue = targetDays || totalDays;
        completed = progressValue >= targetValue;
        break;
      }
      case "session_count": {
        const taggedActs = requiredTag
          ? activities.filter((a) => a.participation_type === requiredTag)
          : activities;
        progressValue = taggedActs.length;
        targetValue = targetSessions;
        completed = progressValue >= targetValue;
        break;
      }
      case "tagged_minutes": {
        const taggedActs = requiredTag
          ? activities.filter((a) => a.participation_type === requiredTag)
          : activities;
        progressValue = taggedActs.reduce((s, a) => s + (a.duration_minutes || 0), 0);
        targetValue = targetMinutes;
        completed = progressValue >= targetValue;
        break;
      }
      case "active_days": {
        const uniqueDays = new Set(activities.map((a) => a.created_at.split("T")[0]));
        progressValue = uniqueDays.size;
        targetValue = targetDays;
        completed = progressValue >= targetValue;
        break;
      }
      case "unique_activity_types": {
        const uniqueTypes = new Set(activities.map((a) => a.activity_type));
        progressValue = uniqueTypes.size;
        targetValue = targetSessions;
        completed = progressValue >= targetValue;
        break;
      }
      default:
        progressValue = activities.reduce((s, a) => s + (a.duration_minutes || 0), 0);
        targetValue = targetMinutes;
        completed = progressValue >= targetValue;
    }

    return {
      challenge_id: eventId,
      user_id: userId,
      school_id: event.target_schools?.[0] || "",
      progress_value: progressValue,
      target_value: targetValue,
      completed,
    };
  }

  async getHouseChallengeProgress(
    eventId: string,
    houseId: string,
    schoolId: string,
  ): Promise<ChallengeProgress | null> {
    const event = await this.getById(eventId);
    if (!event) return null;

    const completionType = event.completion_type || "collective_minutes_total";
    const targetMinutes = event.target_minutes || 0;
    const targetDays = event.target_days || 1;
    const requiredTag = event.required_tag;

    const { data: houseUsers } = await this.supabaseClient
      .from("users")
      .select("id")
      .eq("house_id", houseId)
      .eq("school_id", schoolId)
      .eq("is_deleted", false);

    if (!houseUsers || houseUsers.length === 0) {
      return {
        challenge_id: eventId,
        user_id: "",
        house_id: houseId,
        school_id: schoolId,
        progress_value: 0,
        target_value: 0,
        completed: false,
      };
    }

    const userIds = houseUsers.map((u) => u.id);

    const { data: activities } = await this.supabaseClient
      .from("activities")
      .select("duration_minutes, participation_type, user_id, created_at")
      .in("user_id", userIds)
      .eq("is_rejected", false)
      .gte("created_at", event.start_date)
      .lte("created_at", event.end_date);

    if (!activities) {
      return {
        challenge_id: eventId,
        user_id: "",
        house_id: houseId,
        school_id: schoolId,
        progress_value: 0,
        target_value: 0,
        completed: false,
      };
    }

    let progressValue = 0;
    let targetValue = 0;
    let completed = false;

    switch (completionType) {
      case "collective_minutes_total": {
        const taggedActs = requiredTag
          ? activities.filter((a) => a.participation_type === requiredTag)
          : activities;
        progressValue = taggedActs.reduce((s, a) => s + (a.duration_minutes || 0), 0);
        targetValue = targetMinutes;
        completed = progressValue >= targetValue;
        break;
      }
      case "collective_minutes_daily": {
        const dailyMap = new Map<string, number>();
        for (const a of activities) {
          if (requiredTag && a.participation_type !== requiredTag) continue;
          const day = a.created_at.split("T")[0];
          dailyMap.set(day, (dailyMap.get(day) || 0) + (a.duration_minutes || 0));
        }
        progressValue = Array.from(dailyMap.values()).filter((m) => m >= targetMinutes).length;
        const totalDays =
          Math.ceil(
            (new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;
        targetValue = targetDays || totalDays;
        completed = progressValue >= targetValue;
        break;
      }
      case "participation_rate": {
        const uniqueParticipated = new Set(
          activities
            .filter((a) => (a.duration_minutes || 0) >= (targetMinutes || 30))
            .map((a) => a.user_id),
        );
        progressValue = uniqueParticipated.size;
        targetValue = userIds.length;
        completed = progressValue / targetValue >= 0.5;
        break;
      }
      default:
        progressValue = activities.reduce((s, a) => s + (a.duration_minutes || 0), 0);
        targetValue = targetMinutes;
        completed = progressValue >= targetValue;
    }

    return {
      challenge_id: eventId,
      user_id: "",
      house_id: houseId,
      school_id: schoolId,
      progress_value: progressValue,
      target_value: targetValue,
      completed,
    };
  }

  async getChallengeParticipants(eventId: string, schoolId: string): Promise<ChallengeProgress[]> {
    const event = await this.getById(eventId);
    if (!event) return [];

    const { data: activities } = await this.supabaseClient
      .from("activities")
      .select("user_id, duration_minutes")
      .eq("event_id", eventId)
      .eq("is_rejected", false)
      .gte("created_at", event.start_date)
      .lte("created_at", event.end_date);

    if (!activities) return [];

    const userProgress = new Map<string, number>();
    for (const a of activities) {
      userProgress.set(a.user_id, (userProgress.get(a.user_id) || 0) + (a.duration_minutes || 0));
    }

    const results: ChallengeProgress[] = [];
    const targetValue = event.target_minutes || 1;

    for (const [userId, progressValue] of userProgress) {
      results.push({
        challenge_id: eventId,
        user_id: userId,
        school_id: schoolId,
        progress_value: progressValue,
        target_value: targetValue,
        completed: progressValue >= targetValue,
      });
    }

    return results.sort((a, b) => b.progress_value - a.progress_value);
  }
}
