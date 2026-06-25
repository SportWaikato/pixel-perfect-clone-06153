export interface SchoolUpdateInterface {
  id: string;
  school_id: string;
  created_by: string;
  title: string;
  body?: string | null;
  image_url?: string | null;
  image_storage_path?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
  school?: { name: string };
}
