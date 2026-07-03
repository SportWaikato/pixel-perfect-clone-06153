import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import TermManagementContent from "@/modules/admin/components/settings/TermManagementContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/settings")({
  validateSearch: (s: Record<string, unknown>): { schoolId?: string } => ({
    schoolId: typeof s.schoolId === "string" ? s.schoolId : undefined,
  }),
  head: () => ({ meta: [{ title: "Settings — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const { schoolId } = Route.useSearch();
  if (!profile) return null;
  const user = profile as UserInterface;
  return (
    <TermManagementContent
      terms={[]}
      schoolId={schoolId ?? user.school_id ?? ""}
      currentUser={user}
    />
  );
}
