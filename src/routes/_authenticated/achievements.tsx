import { createFileRoute } from "@tanstack/react-router";
import AchievementsGrid from "@/modules/achievements/components/AchievementsGrid";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import {
  AchievementInterface,
  UserAchievementInterface,
} from "@/models/achievements/interfaces/AchievementInterface";
import { AchievementService } from "@/models/achievements/services/AchievementService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({ meta: [{ title: "Achievements — Karawhiua" }] }),
  beforeLoad: async ({ context }) => {
    const profile = context.profile as UserInterface | null;

    if (!profile) {
      return {
        userAchievements: [] as UserAchievementInterface[],
        allAchievements: [] as AchievementInterface[],
      };
    }

    const supabase = createSupabaseClient();
    const achievementService = new AchievementService(supabase);

    const [userAchievements, allAchievements] = await Promise.all([
      achievementService.getUserAchievements(profile.id),
      achievementService.getAllAchievements(),
    ]);

    return { userAchievements, allAchievements };
  },
  component: AchievementsPage,
});

function AchievementsPage() {
  const { userAchievements, allAchievements } = Route.useRouteContext();

  return (
    <AchievementsGrid
      userAchievements={userAchievements as UserAchievementInterface[]}
      allAchievements={allAchievements as AchievementInterface[]}
    />
  );
}
