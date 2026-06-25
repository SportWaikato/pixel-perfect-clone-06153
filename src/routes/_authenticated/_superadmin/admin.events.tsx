import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import EventApprovalContent from "@/modules/admin/components/EventApprovalContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/events")({
  head: () => ({ meta: [{ title: "Events — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <EventApprovalContent user={profile as UserInterface} schools={[]} />;
}
