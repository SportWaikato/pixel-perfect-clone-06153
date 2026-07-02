import { createFileRoute } from "@tanstack/react-router";
import DashboardContent from "@/modules/dashboard/components/DashboardContent";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import {
  AchievementInterface,
  UserAchievementInterface,
} from "@/models/achievements/interfaces/AchievementInterface";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import { AchievementService } from "@/models/achievements/services/AchievementService";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { UserService } from "@/models/users/services/UserService";
import { SurveyService } from "@/models/surveys/services/SurveyService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Karawhiua" },
      { name: "description", content: "Your Karawhiua Virtual Sports Day dashboard." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const profile = context.profile as UserInterface | null;

    if (!profile) {
      return {
        userAchievements: [] as UserAchievementInterface[],
        allAchievements: [] as AchievementInterface[],
        userPointsData: {
          totalFinalPoints: 0,
          totalBasePoints: 0,
          totalBonusPoints: 0,
          challengeActivitiesCount: 0,
          totalActivitiesCount: 0,
        },
        currentMonthMinutes: 0,
        recentActivities: [] as ActivityInterface[],
        pendingSurvey: null,
      };
    }

    const supabase = createSupabaseClient();
    const achievementService = new AchievementService(supabase);
    const activityService = new ActivityService(supabase);
    const userService = new UserService(supabase);
    const surveyService = new SurveyService(supabase);

    await surveyService.checkAndTriggerSurveys(profile.id, profile.created_at);

    const [
      userAchievements,
      allAchievements,
      userPointsData,
      monthProgress,
      recentActivities,
      pendingSurvey,
    ] = await Promise.all([
      achievementService.getUserAchievements(profile.id),
      achievementService.getAllAchievements(),
      userService.getUserPointsBreakdown(profile.id),
      userService.getCurrentMonthProgress(profile.id),
      activityService.getByUserId(profile.id, 3),
      surveyService.shouldShowSurvey(profile.id),
    ]);

    return {
      userAchievements,
      allAchievements,
      userPointsData,
      currentMonthMinutes:
        (monthProgress as { current_month_minutes?: number } | null)?.current_month_minutes ?? 0,
      recentActivities: recentActivities ?? [],
      pendingSurvey,
    };
  },
  component: Dashboard,
});

function Dashboard() {
  const {
    profile,
    userAchievements,
    allAchievements,
    userPointsData,
    currentMonthMinutes,
    recentActivities,
    pendingSurvey,
  } = Route.useRouteContext();

  if (!profile) return null;
  const userProfile = profile as UserInterface;

  return (
    <DashboardContent
      user={userProfile}
      initialUserAchievements={userAchievements as UserAchievementInterface[]}
      allAchievements={allAchievements as AchievementInterface[]}
      initialTotalPoints={(userPointsData as { totalFinalPoints: number }).totalFinalPoints}
      initialCurrentMonthMinutes={currentMonthMinutes as number}
      recentActivities={recentActivities as ActivityInterface[]}
      pendingSurvey={
        pendingSurvey as {
          survey: import("@/models/surveys/interfaces/SurveyInterface").SurveyInterface;
          status: import("@/models/surveys/interfaces/SurveyInterface").UserSurveyStatusInterface;
        } | null
      }
    />
  );
}
