export interface SchoolTermInterface {
  id: string;
  school_id: string;
  year: number;
  term_number: 1 | 2 | 3 | 4;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string;   // 'YYYY-MM-DD'
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
