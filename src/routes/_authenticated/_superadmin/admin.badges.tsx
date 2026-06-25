import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import BadgeManagementContent from "@/modules/admin/components/BadgeManagementContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/badges")({
  head: () => ({ meta: [{ title: "Badges — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <BadgeManagementContent user={profile as UserInterface} />;
}
