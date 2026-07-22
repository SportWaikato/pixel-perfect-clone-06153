export interface HouseInterface {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  color: string;
  school_id: string;
  total_points: number;
  // Current-term competition points — zeroed and archived each term rollover.
  // total_points is the lifetime accumulation and is never reset.
  term_points?: number | null;
  total_kilometers: number;
}
