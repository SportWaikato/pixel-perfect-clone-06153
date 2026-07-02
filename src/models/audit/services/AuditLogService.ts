import { SupabaseClient } from "@supabase/supabase-js";
import { AuditLogInterface } from "../interfaces/AuditLogInterface";

const TABLE_NAME = "audit_log";

export class AuditLogService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async logAction(
    userId: string,
    action: string,
    targetType: string,
    targetId: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
    schoolId: string,
  ): Promise<void> {
    const { error } = await this.supabaseClient.from(TABLE_NAME).insert({
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId,
      old_values: oldValues,
      new_values: newValues,
      school_id: schoolId,
    });

    if (error) {
      console.error("Failed to log audit action:", error);
    }
  }

  async getAuditLog(schoolId: string, limit: number = 100): Promise<AuditLogInterface[]> {
    const { data, error } = await this.supabaseClient.rpc("get_audit_log", {
      p_school_id: schoolId,
      p_limit: limit,
    });

    if (error) throw new Error(error.message);
    return (data || []) as AuditLogInterface[];
  }
}
