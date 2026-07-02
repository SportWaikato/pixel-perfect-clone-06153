import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import {
  SurveyInterface,
  UserSurveyStatusInterface,
} from "@/models/surveys/interfaces/SurveyInterface";
import { SurveyService } from "@/models/surveys/services/SurveyService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import SurveyPageContent from "@/modules/surveys/components/SurveyPageContent";

export const Route = createFileRoute("/_authenticated/survey")({
  head: () => ({ meta: [{ title: "Survey — Karawhiua" }] }),
  beforeLoad: async ({ context }) => {
    const profile = context.profile as UserInterface | null;

    if (!profile) {
      return { pendingSurvey: null };
    }

    const supabase = createSupabaseClient();
    const surveyService = new SurveyService(supabase);

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
