import { SupabaseClient } from "@supabase/supabase-js";
import {
  UserReport,
  VerificationResult,
  SchoolVerification,
} from "../interfaces/ReportingInterface";

export class ReportingService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getUniqueUserReport(
    schoolId: string,
    startDate: string,
    endDate: string,
  ): Promise<UserReport[]> {
    const { data, error } = await this.supabaseClient.rpc("get_unique_user_report", {
      p_school_id: schoolId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) throw new Error(error.message);
    return (data || []) as UserReport[];
  }

  async verifyUserTotals(userId: string): Promise<VerificationResult> {
    const { data, error } = await this.supabaseClient
      .rpc("verify_user_totals", { p_user_id: userId })
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as VerificationResult;
  }

  async verifySchoolTotals(schoolId: string): Promise<SchoolVerification[]> {
    const { data, error } = await this.supabaseClient.rpc("verify_school_totals", {
      p_school_id: schoolId,
    });

    if (error) throw new Error(error.message);
    return (data || []) as SchoolVerification[];
  }

  async exportUserReport(schoolId: string, startDate: string, endDate: string): Promise<string> {
    const report = await this.getUniqueUserReport(schoolId, startDate, endDate);

    const headers = [
      "First Name",
      "Last Name",
      "Username",
      "Email",
      "House",
      "Year Group",
      "Total Minutes",
      "Total Points",
      "Total Activities",
    ];

    const rows = report.map((u) =>
      [
        u.first_name,
        u.last_name,
        u.username,
        u.email || "",
        u.house_name || "",
        u.year_group || "",
        u.total_minutes,
        u.total_points,
        u.total_activities,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );

    return [headers.join(","), ...rows].join("\n");
  }
}
