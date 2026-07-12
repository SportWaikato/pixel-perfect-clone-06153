import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import {
  SurveyInterface,
  UserSurveyStatusInterface,
} from "@/models/surveys/interfaces/SurveyInterface";
import { SurveyService } from "@/models/surveys/services/SurveyService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import SurveyPageContent from "@/modules/surveys/components/SurveyPageContent";

interface SurveySearch {
  surveyId?: string;
  completed?: string;
}

export const Route = createFileRoute("/_authenticated/survey")({
  head: () => ({ meta: [{ title: "Survey — Karawhiua" }] }),
  validateSearch: (search: Record<string, unknown>): SurveySearch => ({
    surveyId: typeof search.surveyId === "string" ? search.surveyId : undefined,
    completed: typeof search.completed === "string" ? search.completed : undefined,
  }),
  beforeLoad: async ({ context, search }) => {
    const profile = context.profile as UserInterface | null;

    if (!profile) {
      return { pendingSurvey: null };
    }

    const supabase = createSupabaseClient();
    const surveyService = new SurveyService(supabase);

    const { surveyId } = search as SurveySearch;

    // When a specific survey is requested (via a "Take Survey" button), open it
    // directly for submission regardless of whether it is currently pending.
    if (surveyId) {
      const survey = await surveyService.getSurveyById(surveyId);
      if (survey) {
        const statuses = await surveyService.getUserSurveyStatus(profile.id);
        const existing = statuses.find((s) => s.survey_type === survey.survey_type);
        const status: UserSurveyStatusInterface = existing ?? {
          id: "",
          user_id: profile.id,
          survey_type: survey.survey_type,
          status: "pending",
          triggered_at: new Date().toISOString(),
          completed_at: null,
          created_at: new Date().toISOString(),
        };
        return { pendingSurvey: { survey, status } };
      }
    }

    await surveyService.checkAndTriggerSurveys(profile.id, profile.created_at);
    const pending = await surveyService.shouldShowSurvey(profile.id);

    return { pendingSurvey: pending };
  },
  component: SurveyPage,
});

function SurveyPage() {
  const { pendingSurvey } = Route.useRouteContext();

  return (
    <SurveyPageContent
      pendingSurvey={
        pendingSurvey as { survey: SurveyInterface; status: UserSurveyStatusInterface } | null
      }
    />
  );
}
