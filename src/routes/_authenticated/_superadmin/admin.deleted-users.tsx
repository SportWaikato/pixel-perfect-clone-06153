import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import DeletedUsersContent from "@/modules/admin/components/DeletedUsersContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/deleted-users")({
  head: () => ({ meta: [{ title: "Deleted Users — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <DeletedUsersContent initialUsers={[]} />;
}
