import { SupabaseClient } from "@supabase/supabase-js";
import {
  AssemblyWinnerInterface,
  HouseTopScorer,
  HouseWeeklyPoints,
} from "../interfaces/AssemblyWinnerInterface";

const WINNERS_TABLE = "assembly_draw_winners";

export class AssemblyService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getHouseLeaderboardLastNDays(schoolId: string, days: number): Promise<HouseWeeklyPoints[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data: houses, error: housesError } = await this.supabaseClient
      .from("houses")
      .select("id, name, color")
      .eq("school_id", schoolId);

    if (housesError) throw new Error(housesError.message);
    if (!houses || houses.length === 0) return [];

    const { data: users, error: usersError } = await this.supabaseClient
      .from("users")
      .select("id, house_id")
      .eq("school_id", schoolId)
      .eq("is_deleted", false)
      .not("house_id", "is", null);

    if (usersError) throw new Error(usersError.message);
    if (!users || users.length === 0) {
      return houses.map((h) => ({
        house_id: h.id,
        house_name: h.name,
        house_color: h.color,
        weekly_points: 0,
      }));
    }

    const userIds = users.map((u) => u.id);
    const userHouseMap = new Map(users.map((u) => [u.id, u.house_id as string]));

    const { data: activities, error: activitiesError } = await this.supabaseClient
      .from("activities")
      .select("user_id, house_points_awarded")
      .in("user_id", userIds)
      .gte("created_at", cutoff.toISOString())
      .eq("is_rejected", false);

    if (activitiesError) throw new Error(activitiesError.message);

    const pointsByHouse = new Map<string, number>();
    for (const act of activities || []) {
      const houseId = userHouseMap.get(act.user_id);
      if (houseId) {
        pointsByHouse.set(
          houseId,
          (pointsByHouse.get(houseId) || 0) + (act.house_points_awarded || 0),
        );
      }
    }

    return houses
      .map((h) => ({
        house_id: h.id,
        house_name: h.name,
        house_color: h.color,
        weekly_points: pointsByHouse.get(h.id) || 0,
      }))
      .sort((a, b) => b.weekly_points - a.weekly_points);
  }

  async getTopScorersByHouse(schoolId: string, limitPerHouse: number): Promise<HouseTopScorer[]> {
    const { data: houses, error: housesError } = await this.supabaseClient
      .from("houses")
      .select("id, name, color")
      .eq("school_id", schoolId);

    if (housesError) throw new Error(housesError.message);
    if (!houses || houses.length === 0) return [];

    const { data: users, error: usersError } = await this.supabaseClient
      .from("users")
      .select("id, first_name, last_name, total_points, house_id")
      .eq("school_id", schoolId)
      .eq("is_deleted", false)
      .not("house_id", "is", null)
      .eq("is_active", true)
      .neq("role", "super_admin")
      .order("total_points", { ascending: false });

    if (usersError) throw new Error(usersError.message);

    const houseMap = new Map(houses.map((h) => [h.id, h]));
    const countByHouse = new Map<string, number>();
    const result: HouseTopScorer[] = [];

    for (const user of users || []) {
      const houseId = user.house_id as string;
      const count = countByHouse.get(houseId) || 0;
      if (count >= limitPerHouse) continue;

      const house = houseMap.get(houseId);
      if (!house) continue;

      result.push({
        user_id: user.id,
        user_first_name: user.first_name,
        user_last_name: user.last_name,
        total_points: user.total_points,
        house_id: houseId,
        house_name: house.name,
        house_color: house.color,
      });

      countByHouse.set(houseId, count + 1);
    }

    return result;
  }

  async getTopScorersByHouseThisWeek(
    schoolId: string,
    limitPerHouse: number,
  ): Promise<HouseTopScorer[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const { data: houses, error: housesError } = await this.supabaseClient
      .from("houses")
      .select("id, name, color")
      .eq("school_id", schoolId);

    if (housesError) throw new Error(housesError.message);
    if (!houses || houses.length === 0) return [];

    const { data: users, error: usersError } = await this.supabaseClient
      .from("users")
      .select("id, first_name, last_name, house_id")
      .eq("school_id", schoolId)
      .eq("is_deleted", false)
      .not("house_id", "is", null)
      .eq("is_active", true)
      .neq("role", "super_admin");

    if (usersError) throw new Error(usersError.message);
    if (!users || users.length === 0) return [];

    const userIds = users.map((u) => u.id);

    const { data: activities, error: activitiesError } = await this.supabaseClient
      .from("activities")
      .select("user_id, final_points")
      .in("user_id", userIds)
      .gte("created_at", cutoff.toISOString())
      .eq("is_rejected", false);

    if (activitiesError) throw new Error(activitiesError.message);

    const pointsByUser = new Map<string, number>();
    for (const act of activities || []) {
      pointsByUser.set(act.user_id, (pointsByUser.get(act.user_id) || 0) + (act.final_points || 0));
    }

    const houseMap = new Map(houses.map((h) => [h.id, h]));
    const countByHouse = new Map<string, number>();
    const result: HouseTopScorer[] = [];

    const sortedUsers = [...users].sort(
      (a, b) => (pointsByUser.get(b.id) || 0) - (pointsByUser.get(a.id) || 0),
    );

    for (const user of sortedUsers) {
      const houseId = user.house_id as string;
      const count = countByHouse.get(houseId) || 0;
      if (count >= limitPerHouse) continue;

      const house = houseMap.get(houseId);
      if (!house) continue;

      const weeklyPoints = pointsByUser.get(user.id) || 0;
      if (weeklyPoints === 0) continue;

      result.push({
        user_id: user.id,
        user_first_name: user.first_name,
        user_last_name: user.last_name,
        total_points: weeklyPoints,
        house_id: houseId,
        house_name: house.name,
        house_color: house.color,
      });

      countByHouse.set(houseId, count + 1);
    }

    return result;
  }

  async getHousePointsForDateRange(
    schoolId: string,
    startDate: string,
    endDate: string,
  ): Promise<HouseWeeklyPoints[]> {
    const startISO = new Date(`${startDate}T00:00:00+12:00`).toISOString();
    const endISO = new Date(`${endDate}T23:59:59+12:00`).toISOString();

    const { data: houses, error: housesError } = await this.supabaseClient
      .from("houses")
      .select("id, name, color")
      .eq("school_id", schoolId);

    if (housesError) throw new Error(housesError.message);
    if (!houses || houses.length === 0) return [];

    const { data: users, error: usersError } = await this.supabaseClient
      .from("users")
      .select("id, house_id")
      .eq("school_id", schoolId)
      .eq("is_deleted", false)
      .not("house_id", "is", null);

    if (usersError) throw new Error(usersError.message);
    if (!users || users.length === 0) {
      return houses.map((h) => ({
        house_id: h.id,
        house_name: h.name,
        house_color: h.color,
        weekly_points: 0,
      }));
    }

    const userIds = users.map((u) => u.id);
    const userHouseMap = new Map(users.map((u) => [u.id, u.house_id as string]));

    const { data: activities, error: activitiesError } = await this.supabaseClient
      .from("activities")
      .select("user_id, house_points_awarded")
      .in("user_id", userIds)
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .eq("is_rejected", false);

    if (activitiesError) throw new Error(activitiesError.message);

    const pointsByHouse = new Map<string, number>();
    for (const act of activities || []) {
      const houseId = userHouseMap.get(act.user_id);
      if (houseId) {
        pointsByHouse.set(
          houseId,
          (pointsByHouse.get(houseId) || 0) + (act.house_points_awarded || 0),
        );
      }
    }

    return houses
      .map((h) => ({
        house_id: h.id,
        house_name: h.name,
        house_color: h.color,
        weekly_points: pointsByHouse.get(h.id) || 0,
      }))
      .sort((a, b) => b.weekly_points - a.weekly_points);
  }

  async getTopScorersByHouseForDateRange(
    schoolId: string,
    startDate: string,
    endDate: string,
    limitPerHouse: number,
  ): Promise<HouseTopScorer[]> {
    const startISO = new Date(`${startDate}T00:00:00+12:00`).toISOString();
    const endISO = new Date(`${endDate}T23:59:59+12:00`).toISOString();

    const { data: houses, error: housesError } = await this.supabaseClient
      .from("houses")
      .select("id, name, color")
      .eq("school_id", schoolId);

    if (housesError) throw new Error(housesError.message);
    if (!houses || houses.length === 0) return [];

    const { data: users, error: usersError } = await this.supabaseClient
      .from("users")
      .select("id, first_name, last_name, house_id")
      .eq("school_id", schoolId)
      .eq("is_deleted", false)
      .not("house_id", "is", null)
      .eq("is_active", true)
      .neq("role", "super_admin");

    if (usersError) throw new Error(usersError.message);
    if (!users || users.length === 0) return [];

    const userIds = users.map((u) => u.id);

    const { data: activities, error: activitiesError } = await this.supabaseClient
      .from("activities")
      .select("user_id, final_points")
      .in("user_id", userIds)
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .eq("is_rejected", false);

    if (activitiesError) throw new Error(activitiesError.message);

    const pointsByUser = new Map<string, number>();
    for (const act of activities || []) {
      pointsByUser.set(act.user_id, (pointsByUser.get(act.user_id) || 0) + (act.final_points || 0));
    }

    const houseMap = new Map(houses.map((h) => [h.id, h]));
    const countByHouse = new Map<string, number>();
    const result: HouseTopScorer[] = [];

    const sortedUsers = [...users].sort(
      (a, b) => (pointsByUser.get(b.id) || 0) - (pointsByUser.get(a.id) || 0),
    );

    for (const user of sortedUsers) {
      const houseId = user.house_id as string;
      const count = countByHouse.get(houseId) || 0;
      if (count >= limitPerHouse) continue;

      const house = houseMap.get(houseId);
      if (!house) continue;

      const periodPoints = pointsByUser.get(user.id) || 0;
      if (periodPoints === 0) continue;

      result.push({
        user_id: user.id,
        user_first_name: user.first_name,
        user_last_name: user.last_name,
        total_points: periodPoints,
        house_id: houseId,
        house_name: house.name,
        house_color: house.color,
      });

      countByHouse.set(houseId, count + 1);
    }

    return result;
  }

  async saveWinner(
    winner: Omit<AssemblyWinnerInterface, "id" | "created_at">,
  ): Promise<AssemblyWinnerInterface> {
    const { data, error } = await this.supabaseClient
      .from(WINNERS_TABLE)
      .insert(winner)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getWinnersLog(schoolId: string, limit = 50): Promise<AssemblyWinnerInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(WINNERS_TABLE)
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  }
}
