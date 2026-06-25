export interface SuperAdminInviteInterface {
  id: string;
  token: string;
  email: string;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}
