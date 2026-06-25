import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import SchoolAdminDashboard from "@/modules/admin/components/SchoolAdminDashboard";

export const Route = createFileRoute("/_authenticated/_admin/school")({
  head: () => ({ meta: [{ title: "My School — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  const user = profile as UserInterface;
  return <SchoolAdminDashboard user={user} viewingSchoolId={user.school_id} viewingSchoolName={user.school?.name ?? ''} viewingSchoolRegistrationMethod={user.school?.registration_method ?? undefined} />;
}
