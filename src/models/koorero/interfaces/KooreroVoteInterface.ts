import { UserInterface } from "@/models/users/interfaces/UserInterface";

export interface KooreroVoteInterface {
  id: string;
  user_id: string;
  interest_level: number; // 1-5 scale
  feedback?: string;
  created_at: string;
  updated_at: string;

  // Relationships
  user?: UserInterface;
}

export const INTEREST_LEVELS = {
  1: "Not interested",
  2: "Slightly interested",
  3: "Moderately interested",
  4: "Very interested",
  5: "Extremely interested",
} as const;
