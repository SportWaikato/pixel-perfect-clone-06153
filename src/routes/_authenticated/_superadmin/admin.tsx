import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import AdminDashboardContent from "@/modules/admin/components/AdminDashboardContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin")({
  head: () => ({ meta: [{ title: "Admin — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  // @ts-expect-error — minimal props for stub; full data fetch in next pass
  return <AdminDashboardContent user={profile as UserInterface} schools={[]} />;
}
