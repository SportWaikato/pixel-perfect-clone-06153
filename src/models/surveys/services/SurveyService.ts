import { SupabaseClient } from "@supabase/supabase-js";
import {
  SurveyInterface,
  SurveyQuestionInterface,
  SurveyResponseInterface,
  UserSurveyStatusInterface,
  SurveyResultsInterface,
  SurveyResultQuestion,
  SurveyType,
} from "../interfaces/SurveyInterface";

const SURVEYS_TABLE = "surveys";
const QUESTIONS_TABLE = "survey_questions";
const RESPONSES_TABLE = "survey_responses";
const STATUS_TABLE = "user_survey_status";

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;
const TWELVE_WEEKS_MS = 84 * 24 * 60 * 60 * 1000;

export class SurveyService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getSurveyByType(surveyType: SurveyType): Promise<SurveyInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(SURVEYS_TABLE)
      .select(`*, questions:${QUESTIONS_TABLE}(*)`)
      .eq("survey_type", surveyType)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;

    return {
      ...data,
      questions: (data.questions || []).sort(
        (a: SurveyQuestionInterface, b: SurveyQuestionInterface) =>
          a.display_order - b.display_order,
      ),
    };
  }

  async getSurveyById(surveyId: string): Promise<SurveyInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(SURVEYS_TABLE)
      .select(`*, questions:${QUESTIONS_TABLE}(*)`)
      .eq("id", surveyId)
      .single();

    if (error || !data) return null;

    return {
      ...data,
      questions: (data.questions || []).sort(
        (a: SurveyQuestionInterface, b: SurveyQuestionInterface) =>
          a.display_order - b.display_order,
      ),
    };
  }

  async getUserSurveyStatus(userId: string): Promise<UserSurveyStatusInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(STATUS_TABLE)
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user survey status:", error);
      return [];
    }

    return data || [];
  }

  async checkAndTriggerSurveys(userId: string, userCreatedAt: string): Promise<void> {
    const now = new Date();
    const signupDate = new Date(userCreatedAt);
    const existingStatuses = await this.getUserSurveyStatus(userId);
    const existingTypes = new Set(existingStatuses.map((s) => s.survey_type));

    const ensureStatus = async (surveyType: SurveyType, triggeredAt: string) => {
      if (existingTypes.has(surveyType)) return;
      await this.supabaseClient.from(STATUS_TABLE).insert({
        user_id: userId,
        survey_type: surveyType,
        status: "pending",
        triggered_at: triggeredAt,
      });
    };

    if (
      now.getTime() - signupDate.getTime() >= THREE_WEEKS_MS &&
      !existingTypes.has("early_engagement")
    ) {
      await ensureStatus(
        "early_engagement",
        new Date(signupDate.getTime() + THREE_WEEKS_MS).toISOString(),
      );
    }

    if (
      now.getTime() - signupDate.getTime() >= TWELVE_WEEKS_MS &&
      !existingTypes.has("behaviour_change")
    ) {
      await ensureStatus(
        "behaviour_change",
        new Date(signupDate.getTime() + TWELVE_WEEKS_MS).toISOString(),
      );
    }

    const currentMonth = now.getMonth();
    if (currentMonth === 11 && !existingTypes.has("end_of_year")) {
      await ensureStatus("end_of_year", now.toISOString());
    }
  }

  async triggerChallengeSurvey(userId: string): Promise<void> {
    const existingStatuses = await this.getUserSurveyStatus(userId);
    const challengeStatus = existingStatuses.find((s) => s.survey_type === "challenge_completion");

    if (challengeStatus) {
      if (challengeStatus.status === "completed") {
        await this.supabaseClient
          .from(STATUS_TABLE)
          .update({ status: "pending", triggered_at: new Date().toISOString(), completed_at: null })
          .eq("id", challengeStatus.id);
      }
      return;
    }

    await this.supabaseClient.from(STATUS_TABLE).insert({
      user_id: userId,
      survey_type: "challenge_completion",
      status: "pending",
      triggered_at: new Date().toISOString(),
    });
  }

  async submitResponse(
    userId: string,
    questionId: string,
    surveyId: string,
    answer: string | string[] | Record<string, number>,
  ): Promise<SurveyResponseInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(RESPONSES_TABLE)
      .upsert(
        {
          user_id: userId,
          question_id: questionId,
          survey_id: surveyId,
          answer,
        },
        { onConflict: "user_id,question_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("Error submitting survey response:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async submitSurvey(
    userId: string,
    surveyId: string,
    responses: { questionId: string; answer: string | string[] | Record<string, number> }[],
  ): Promise<void> {
    const survey = await this.getSurveyById(surveyId);
    if (!survey) throw new Error("Survey not found");

    const responseRows = responses.map((r) => ({
      user_id: userId,
      survey_id: surveyId,
      question_id: r.questionId,
      answer: r.answer,
    }));

    const { error } = await this.supabaseClient
      .from(RESPONSES_TABLE)
      .upsert(responseRows, { onConflict: "user_id,question_id" });

    if (error) {
      console.error("Error submitting survey:", error);
      throw new Error(error.message);
    }

    const { error: statusError } = await this.supabaseClient
      .from(STATUS_TABLE)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("survey_type", survey.survey_type);

    if (statusError) {
      console.error("Error updating survey status:", statusError);
      throw new Error(statusError.message);
    }
  }

  async dismissSurvey(userId: string, surveyType: SurveyType): Promise<void> {
    const { error } = await this.supabaseClient
      .from(STATUS_TABLE)
      .update({ status: "dismissed" })
      .eq("user_id", userId)
      .eq("survey_type", surveyType);

    if (error) {
      console.error("Error dismissing survey:", error);
      throw new Error(error.message);
    }
  }

  async shouldShowSurvey(
    userId: string,
  ): Promise<{ survey: SurveyInterface; status: UserSurveyStatusInterface } | null> {
    const statuses = await this.getUserSurveyStatus(userId);
    const pending = statuses
      .filter((s) => s.status === "pending")
      .sort((a, b) => new Date(a.triggered_at).getTime() - new Date(b.triggered_at).getTime());

    if (pending.length === 0) return null;

    const survey = await this.getSurveyByType(pending[0].survey_type);
    if (!survey) return null;

    return { survey, status: pending[0] };
  }

  async getSurveyResults(
    surveyId: string,
    schoolId?: string,
  ): Promise<SurveyResultsInterface | null> {
    const survey = await this.getSurveyById(surveyId);
    if (!survey) return null;

    let responseQuery = this.supabaseClient
      .from(RESPONSES_TABLE)
      .select("question_id, answer, user_id")
      .eq("survey_id", surveyId);

    if (schoolId) {
      const { data: schoolUsers } = await this.supabaseClient
        .from("users")
        .select("id")
        .eq("school_id", schoolId);

      const userIds = (schoolUsers || []).map((u: { id: string }) => u.id);
      responseQuery = responseQuery.in("user_id", userIds);
    }

    const { data: responses, error } = await responseQuery;

    if (error) {
      console.error("Error fetching survey results:", error);
      return null;
    }

    let statusQuery = this.supabaseClient
      .from(STATUS_TABLE)
      .select("status")
      .eq("survey_type", survey.survey_type);

    if (schoolId) {
      const { data: schoolUsers } = await this.supabaseClient
        .from("users")
        .select("id")
        .eq("school_id", schoolId);

      const userIds = (schoolUsers || []).map((u: { id: string }) => u.id);
      statusQuery = statusQuery.in("user_id", userIds);
    }

    const { data: statuses } = await statusQuery;

    const totalCompleted = (statuses || []).filter((s) => s.status === "completed").length;
    const totalPending = (statuses || []).filter((s) => s.status === "pending").length;
    const totalDismissed = (statuses || []).filter((s) => s.status === "dismissed").length;

    const uniqueRespondents = new Set((responses || []).map((r) => r.user_id));

    const questions: SurveyResultQuestion[] = (survey.questions || []).map((q) => {
      const questionResponses = (responses || []).filter((r) => r.question_id === q.id);

      const distribution: Record<string, number> = {};

      for (const resp of questionResponses) {
        const answer = resp.answer;
        if (Array.isArray(answer)) {
          for (const item of answer) {
            distribution[item] = (distribution[item] || 0) + 1;
          }
        } else if (typeof answer === "object" && answer !== null) {
          for (const key of Object.keys(answer)) {
            distribution[key] = (distribution[key] || 0) + 1;
          }
        } else if (typeof answer === "string") {
          distribution[answer] = (distribution[answer] || 0) + 1;
        }
      }

      return {
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        response_count: questionResponses.length,
        answer_distribution: distribution,
      };
    });

    return {
      survey_id: survey.id,
      survey_name: survey.name,
      survey_type: survey.survey_type,
      total_responses: uniqueRespondents.size,
      total_pending: totalPending,
      total_dismissed: totalDismissed,
      questions,
    };
  }

  async getAllSurveys(): Promise<SurveyInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(SURVEYS_TABLE)
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching all surveys:", error);
      return [];
    }

    return data || [];
  }

  private defaultSurveyDefinitions(): {
    survey_type: SurveyType;
    name: string;
    description: string;
    questions: {
      question_text: string;
      question_type: string;
      answer_options: string[] | null;
      is_required: boolean;
      display_order: number;
    }[];
  }[] {
    return [
      {
        survey_type: "early_engagement",
        name: "Early Engagement Survey",
        description: "Tell us about your first few weeks with Karawhiua",
        questions: [
          {
            question_text: "How did you hear about Karawhiua?",
            question_type: "single_select",
            answer_options: [
              "School teacher",
              "Friend",
              "School assembly",
              "Social media",
              "Other",
            ],
            is_required: true,
            display_order: 1,
          },
          {
            question_text: "What motivated you to sign up?",
            question_type: "multi_select",
            answer_options: [
              "Get fit",
              "Represent my house",
              "Have fun",
              "Win prizes",
              "Friends are doing it",
            ],
            is_required: true,
            display_order: 2,
          },
          {
            question_text: "How easy was the sign up process?",
            question_type: "single_select",
            answer_options: ["Very easy", "Easy", "Neutral", "Difficult", "Very difficult"],
            is_required: true,
            display_order: 3,
          },
          {
            question_text: "Any suggestions to improve the programme?",
            question_type: "free_text",
            answer_options: null,
            is_required: false,
            display_order: 4,
          },
        ],
      },
      {
        survey_type: "behaviour_change",
        name: "Behaviour Change Survey",
        description: "Tell us how Karawhiua has influenced your habits",
        questions: [
          {
            question_text: "Has Karawhiua increased your physical activity?",
            question_type: "single_select",
            answer_options: [
              "Significantly more",
              "A bit more",
              "No change",
              "A bit less",
              "Significantly less",
            ],
            is_required: true,
            display_order: 1,
          },
          {
            question_text: "Which activities have you tried through Karawhiua?",
            question_type: "multi_select",
            answer_options: [
              "Running",
              "Walking",
              "Cycling",
              "Swimming",
              "Team sports",
              "Gym",
              "Other",
            ],
            is_required: true,
            display_order: 2,
          },
          {
            question_text: "Do you feel more connected to your school community?",
            question_type: "single_select",
            answer_options: ["Yes, definitely", "Somewhat", "Not really", "Not at all"],
            is_required: true,
            display_order: 3,
          },
          {
            question_text: "What would encourage you to be more active?",
            question_type: "free_text",
            answer_options: null,
            is_required: false,
            display_order: 4,
          },
        ],
      },
      {
        survey_type: "challenge_completion",
        name: "Challenge Completion Survey",
        description: "Share your experience completing a challenge",
        questions: [
          {
            question_text: "Did you enjoy the challenge format?",
            question_type: "single_select",
            answer_options: ["Loved it", "Liked it", "Neutral", "Didn't like it", "Disliked it"],
            is_required: true,
            display_order: 1,
          },
          {
            question_text: "What types of challenges interest you most?",
            question_type: "multi_select",
            answer_options: [
              "Distance challenges",
              "Duration challenges",
              "Points challenges",
              "Team challenges",
              "Creative challenges",
            ],
            is_required: true,
            display_order: 2,
          },
          {
            question_text: "How would you rate the difficulty?",
            question_type: "single_select",
            answer_options: ["Too easy", "Just right", "Too hard"],
            is_required: true,
            display_order: 3,
          },
          {
            question_text: "What challenge ideas do you have?",
            question_type: "free_text",
            answer_options: null,
            is_required: false,
            display_order: 4,
          },
        ],
      },
      {
        survey_type: "end_of_year",
        name: "End of Year Survey",
        description: "Reflect on your year with Karawhiua",
        questions: [
          {
            question_text: "How would you rate your overall experience?",
            question_type: "single_select",
            answer_options: ["Excellent", "Good", "Average", "Below average", "Poor"],
            is_required: true,
            display_order: 1,
          },
          {
            question_text: "What was your favourite part of Karawhiua?",
            question_type: "multi_select",
            answer_options: [
              "Logging activities",
              "Earning badges",
              "House competitions",
              "Challenges",
              "Assembly draws",
              "The app layout",
            ],
            is_required: true,
            display_order: 2,
          },
          {
            question_text: "Do you plan to participate again next year?",
            question_type: "single_select",
            answer_options: ["Definitely", "Probably", "Maybe", "Probably not", "Definitely not"],
            is_required: true,
            display_order: 3,
          },
          {
            question_text: "What could we improve for next year?",
            question_type: "free_text",
            answer_options: null,
            is_required: false,
            display_order: 4,
          },
        ],
      },
    ];
  }

  async seedDefaultSurveys(): Promise<void> {
    const existing = await this.getAllSurveys();
    if (existing.length >= 4) return;

    for (const def of this.defaultSurveyDefinitions()) {
      const alreadyExists = existing.some((s) => s.survey_type === def.survey_type);
      if (alreadyExists) continue;

      const { data: survey, error: surveyError } = await this.supabaseClient
        .from(SURVEYS_TABLE)
        .insert({
          name: def.name,
          description: def.description,
          survey_type: def.survey_type,
          is_active: true,
        })
        .select()
        .single();

      if (surveyError || !survey) {
        console.error(`Failed to seed survey ${def.survey_type}:`, surveyError);
        continue;
      }

      const questionRows = def.questions.map((q, i) => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        answer_options: q.answer_options,
        is_required: q.is_required,
        display_order: q.display_order || i + 1,
      }));

      await this.supabaseClient.from(QUESTIONS_TABLE).insert(questionRows);
    }
  }
}
