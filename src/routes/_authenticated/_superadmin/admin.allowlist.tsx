import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import AllowedEmailsContent from "@/modules/admin/components/AllowedEmailsContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/allowlist")({
  head: () => ({ meta: [{ title: "Allowlist — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <AllowedEmailsContent user={profile as UserInterface} />;
}
