export interface AuditLogInterface {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  school_id: string;
  created_at: string;
  actor_first_name?: string;
  actor_last_name?: string;
  actor_username?: string;
}
