import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import AuditLogContent from "@/modules/admin/components/AuditLogContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <AuditLogContent user={profile as UserInterface} schools={[]} />;
}
