import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import ActivityLogContent from "@/modules/admin/components/ActivityLogContent";

export const Route = createFileRoute("/_authenticated/_admin/school/activity")({
  head: () => ({ meta: [{ title: "Activity Log — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  const user = profile as UserInterface;
  return <ActivityLogContent user={user} />;
}
