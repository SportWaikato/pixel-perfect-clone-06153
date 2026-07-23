export type SurveyType =
  | "early_engagement"
  | "behaviour_change"
  | "challenge_completion"
  | "end_of_year"
  | "movement_measures"
  | "school_insights";
export type QuestionType = "multi_select" | "single_select" | "rank_order" | "free_text";
export type SurveyStatus = "pending" | "completed" | "dismissed";

export interface SurveyInterface {
  id: string;
  name: string;
  description: string;
  survey_type: SurveyType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions?: SurveyQuestionInterface[];
}

export interface SurveyQuestionInterface {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: QuestionType;
  answer_options: string[];
  display_order: number;
  is_required: boolean;
  created_at: string;
}

export interface SurveyResponseInterface {
  id: string;
  survey_id: string;
  question_id: string;
  user_id: string;
  answer: string | string[] | Record<string, number>;
  created_at: string;
}

export interface UserSurveyStatusInterface {
  id: string;
  user_id: string;
  survey_type: SurveyType;
  status: SurveyStatus;
  triggered_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface SurveyResultQuestion {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  response_count: number;
  answer_distribution: Record<string, number>;
}

export interface SurveyResultsInterface {
  survey_id: string;
  survey_name: string;
  survey_type: SurveyType;
  total_responses: number;
  total_pending: number;
  total_dismissed: number;
  questions: SurveyResultQuestion[];
}
