export interface SchoolMessageInterface {
  id: string;
  school_id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    year_group?: string | null;
  };
  school?: { name: string };
}
