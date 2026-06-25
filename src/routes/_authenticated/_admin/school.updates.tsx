import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import SchoolUpdatesContent from "@/modules/admin/components/SchoolUpdatesContent";

export const Route = createFileRoute("/_authenticated/_admin/school/updates")({
  head: () => ({ meta: [{ title: "School Updates — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  const user = profile as UserInterface;
  return <SchoolUpdatesContent user={user} schools={[]} initialSchoolId={user.school_id} backHref="/school" />;
}
