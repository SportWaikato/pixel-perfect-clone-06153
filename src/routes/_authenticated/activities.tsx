import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import ActivitiesContent from "@/modules/activities/components/ActivitiesContent";

export const Route = createFileRoute("/_authenticated/activities")({
  head: () => ({ meta: [{ title: "Activities — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return (
    <ActivitiesContent
      user={profile as UserInterface}
      initialActivities={[]}
      initialChallenges={[]}
    />
  );
}
