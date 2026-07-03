import { createFileRoute } from "@tanstack/react-router";
import AssemblyManagementContent from "@/modules/admin/components/assembly/AssemblyManagementContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/assembly")({
  validateSearch: (s: Record<string, unknown>): { schoolId?: string } => ({
    schoolId: typeof s.schoolId === "string" ? s.schoolId : undefined,
  }),
  head: () => ({ meta: [{ title: "Assembly — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const { schoolId } = Route.useSearch();
  if (!profile) return null;
  return (
    <AssemblyManagementContent
      winners={[]}
      schoolId={schoolId ?? profile.school_id ?? ""}
      terms={[]}
      schools={[]}
    />
  );
}
