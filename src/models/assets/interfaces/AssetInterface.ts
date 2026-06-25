export interface AssetInterface {
  id: string;
  name: string;
  description: string | null;
  file_url: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_active: boolean;
  school_ids: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
