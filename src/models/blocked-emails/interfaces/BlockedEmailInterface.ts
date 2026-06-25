export interface BlockedEmailInterface {
  id: string;
  school_id: string;
  email: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}
