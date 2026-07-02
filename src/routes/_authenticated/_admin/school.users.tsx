import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import UserManagementContent from "@/modules/admin/components/UserManagementContent";

export const Route = createFileRoute("/_authenticated/_admin/school/users")({
  head: () => ({ meta: [{ title: "Users — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  const user = profile as UserInterface;
  return (
    <UserManagementContent
      user={user}
      backHref="/school"
      schoolId={user.school_id}
      schools={[]}
      initialInvites={[]}
    />
  );
}
