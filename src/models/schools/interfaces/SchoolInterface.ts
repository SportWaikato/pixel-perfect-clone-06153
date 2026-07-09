export interface SchoolInterface {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  code: string;
  email_domain: string | null;
  secondary_email_domain?: string | null;
  total_students: number;
  roll_number?: number | null;
  current_term_id?: string | null;
  region?: string | null;
  school_type?: string | null;
  total_kilometers: number;
  total_points: number;
  is_active: boolean;
  is_internal: boolean;
  registration_method: "domain_blocklist" | "allowlist";
}
