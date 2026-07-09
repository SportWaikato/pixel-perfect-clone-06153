import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import KoreroVotingForm from "@/modules/korero/components/KoreroVotingForm";
import SurveyPromptCard from "@/modules/surveys/components/SurveyPromptCard";
import { SurveyService } from "@/models/surveys/services/SurveyService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { SurveyInterface, UserSurveyStatusInterface } from "@/models/surveys/interfaces/SurveyInterface";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const [pendingSurveys, setPendingSurveys] = useState<
    { survey: SurveyInterface; status: UserSurveyStatusInterface }[]
  >([]);

  useEffect(() => {
    const user = profile as UserInterface | null;
    if (!user) return;

    const supabase = createSupabaseClient();
    const surveyService = new SurveyService(supabase);

    surveyService.getAllSurveys().then((allSurveys) => {
      const active = allSurveys.filter((s) => s.is_active);
      const pending = allSurveys.map((survey) => ({
        survey,
        status: {
          survey_type: survey.survey_type,
          status: "pending",
        } as UserSurveyStatusInterface,
      }));
      setPendingSurveys(pending);
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-[#1B5E4B]">Announcements</h1>

      {pendingSurveys.map((item) => (
        <SurveyPromptCard
          key={item.survey.id}
          surveyType={item.survey.survey_type}
          surveyName={item.survey.name}
        />
      ))}

      <KoreroVotingForm user={profile as UserInterface} />
    </div>
  );
}
