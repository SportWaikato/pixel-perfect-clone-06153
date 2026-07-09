import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import SurveyPromptCard from "@/modules/surveys/components/SurveyPromptCard";
import { SurveyService } from "@/models/surveys/services/SurveyService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import {
  SurveyInterface,
  UserSurveyStatusInterface,
} from "@/models/surveys/interfaces/SurveyInterface";
import { Megaphone } from "lucide-react";

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
      const pending = active.map((survey) => ({
        survey,
        status: { survey_type: survey.survey_type, status: "pending" } as UserSurveyStatusInterface,
      }));
      setPendingSurveys(pending);
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 min-h-screen">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
          Announcements
        </h1>
        <p className="mt-1 text-body text-brand-dark/70">
          The latest from Sport Waikato and your school.
        </p>
      </div>

      {pendingSurveys.length > 0 ? (
        pendingSurveys.map((item) => (
          <SurveyPromptCard
            key={item.survey.id}
            surveyType={item.survey.survey_type}
            surveyName={item.survey.name}
          />
        ))
      ) : (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1B5E4B]/10 flex items-center justify-center">
            <Megaphone size={28} className="text-[#1B5E4B]" />
          </div>
          <h2 className="text-xl font-bold text-[#1B5E4B]">No announcements right now</h2>
          <p className="text-gray-500">
            Survey prompts and school updates will appear here when available.
          </p>
        </div>
      )}
    </div>
  );
}
