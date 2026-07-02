import { createFileRoute } from "@tanstack/react-router";
import SuperAdminInviteSection from "@/modules/admin/components/SuperAdminInviteSection";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/invites")({
  head: () => ({ meta: [{ title: "Super Admin Invites — Karawhiua" }] }),
  component: Page,
});

function Page() {
  return <SuperAdminInviteSection initialInvites={[]} />;
}
