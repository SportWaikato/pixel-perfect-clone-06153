import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SurveyService } from "@/models/surveys/services/SurveyService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import AdminSurveysContent from "@/modules/surveys/components/AdminSurveysContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/surveys")({
  head: () => ({ meta: [{ title: "Survey Results — Karawhiua" }] }),
  beforeLoad: async ({ context }) => {
    const profile = context.profile as UserInterface | null;

    if (!profile) {
      return { surveys: [], results: [] };
    }

    const supabase = createSupabaseClient();
    const surveyService = new SurveyService(supabase);
    const surveys = await surveyService.getAllSurveys();

    const results = await Promise.all(surveys.map((s) => surveyService.getSurveyResults(s.id)));

    return { surveys, results };
  },
  component: AdminSurveysPage,
});

function AdminSurveysPage() {
  const { surveys, results } = Route.useRouteContext();

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <AdminSurveysContent surveys={surveys as any[]} results={results as any[]} />
    </div>
  );
}
