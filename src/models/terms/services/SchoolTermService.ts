import { SupabaseClient } from "@supabase/supabase-js";
import { SchoolTermInterface } from "../interfaces/SchoolTermInterface";

const TABLE = "school_terms";

const nzDateString = (date: Date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(date);

export class SchoolTermService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getBySchoolId(schoolId: string): Promise<SchoolTermInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .select("*")
      .eq("school_id", schoolId)
      .order("year", { ascending: false })
      .order("term_number", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBySchoolAndYear(schoolId: string, year: number): Promise<SchoolTermInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .select("*")
      .eq("school_id", schoolId)
      .eq("year", year)
      .order("term_number", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getCurrentTerm(schoolId: string): Promise<SchoolTermInterface | null> {
    const today = nzDateString();
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .select("*")
      .eq("school_id", schoolId)
      .lte("start_date", today)
      .gte("end_date", today)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async create(
    termData: Omit<SchoolTermInterface, "id" | "created_at" | "updated_at">,
  ): Promise<SchoolTermInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .insert(termData)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, termData: Partial<SchoolTermInterface>): Promise<SchoolTermInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE)
      .update({ ...termData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseClient.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async setCurrentTerm(schoolId: string, termId: string): Promise<void> {
    await this.supabaseClient.from(TABLE).update({ is_current: false }).eq("school_id", schoolId);
    await this.supabaseClient.from(TABLE).update({ is_current: true }).eq("id", termId);
  }

  static getCurrentWeekNumber(term: SchoolTermInterface): number {
    const today = nzDateString();
    const start = new Date(term.start_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil((diffDays + 1) / 7));
  }

  static getTotalWeeks(term: SchoolTermInterface): number {
    const start = new Date(term.start_date);
    const end = new Date(term.end_date);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.ceil(diffDays / 7);
  }

  static getWeekBounds(
    term: SchoolTermInterface,
    weekNumber: number,
  ): { startDate: string; endDate: string } {
    const termStart = new Date(term.start_date);
    const termEnd = new Date(term.end_date);

    const weekStart = new Date(termStart);
    weekStart.setDate(termStart.getDate() + (weekNumber - 1) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const clampedEnd = weekEnd > termEnd ? termEnd : weekEnd;

    return {
      startDate: nzDateString(weekStart),
      endDate: nzDateString(clampedEnd),
    };
  }

  static isActive(term: SchoolTermInterface): boolean {
    const today = nzDateString();
    return term.start_date <= today && today <= term.end_date;
  }
}
