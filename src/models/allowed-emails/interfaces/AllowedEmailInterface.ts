export interface AllowedEmailInterface {
  id: string;
  school_id: string;
  email: string;
  note: string | null;
  created_at: string;
  created_by: string | null;
  user_id: string | null;
}
