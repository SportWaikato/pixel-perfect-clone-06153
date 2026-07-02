import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import TermManagementContent from "@/modules/admin/components/settings/TermManagementContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  const user = profile as UserInterface;
  return <TermManagementContent terms={[]} schoolId={user.school_id ?? ""} currentUser={user} />;
}
