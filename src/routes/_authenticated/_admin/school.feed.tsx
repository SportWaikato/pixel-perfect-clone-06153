import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import SchoolFeedContent from "@/modules/activities/components/SchoolFeedContent";

export const Route = createFileRoute("/_authenticated/_admin/school/feed")({
  head: () => ({ meta: [{ title: "School Feed — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  const user = profile as UserInterface;
  if (!user.school_id) return null;

  return <SchoolFeedContent schoolId={user.school_id} userId={user.id} />;
}
