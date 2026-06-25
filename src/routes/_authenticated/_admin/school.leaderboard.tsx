import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import LeaderboardContent from "@/modules/leaderboards/components/LeaderboardContent";

export const Route = createFileRoute("/_authenticated/_admin/school/leaderboard")({
  head: () => ({ meta: [{ title: "School Leaderboard — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  // @ts-expect-error — minimal props until next pass
  return <LeaderboardContent user={profile as UserInterface} />;
}
