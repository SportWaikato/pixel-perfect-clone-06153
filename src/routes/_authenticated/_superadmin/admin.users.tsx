import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import UserManagementContent from "@/modules/admin/components/UserManagementContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/users")({
  head: () => ({ meta: [{ title: "Users — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <UserManagementContent user={profile as UserInterface} backHref="/admin" schools={[]} initialInvites={[]} />;
}
