import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import SchoolManagementContent from "@/modules/admin/components/SchoolManagementContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/schools")({
  head: () => ({ meta: [{ title: "Schools — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <SchoolManagementContent user={profile as UserInterface} initialSchools={[]} />;
}
