export interface AssemblyWinnerInterface {
  id: string;
  created_at: string;
  school_id: string;
  drawn_by: string;
  user_id: string | null;
  user_first_name: string;
  user_last_name: string;
  user_username: string;
  house_name: string | null;
  house_color: string | null;
}

export interface HouseWeeklyPoints {
  house_id: string;
  house_name: string;
  house_color: string;
  weekly_points: number;
}

export interface HouseTopScorer {
  user_id: string;
  user_first_name: string;
  user_last_name: string;
  total_points: number;
  house_id: string;
  house_name: string;
  house_color: string;
}
