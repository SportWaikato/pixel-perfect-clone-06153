export interface UserReport {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  house_name: string;
  year_group: string;
  total_minutes: number;
  total_points: number;
  total_activities: number;
}

export interface VerificationResult {
  user_id: string;
  cached_total_minutes: number;
  live_total_minutes: number;
  cached_total_points: number;
  live_total_points: number;
  cached_total_kilometers: number;
  live_total_kilometers: number;
  is_consistent: boolean;
}

export interface SchoolVerification {
  house_id: string;
  house_name: string;
  cached_total_points: number;
  live_total_points: number;
  is_consistent: boolean;
}
