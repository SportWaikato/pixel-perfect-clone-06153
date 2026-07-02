import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import ReportsContent from "@/modules/admin/components/ReportsContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <ReportsContent user={profile as UserInterface} schools={[]} currentTerm={null} />;
}
