import { createFileRoute } from "@tanstack/react-router";
import AssemblyManagementContent from "@/modules/admin/components/assembly/AssemblyManagementContent";

export const Route = createFileRoute("/_authenticated/_admin/school/assembly")({
  head: () => ({ meta: [{ title: "Assembly — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return (
    <AssemblyManagementContent
      winners={[]}
      schoolId={profile.school_id ?? ""}
      terms={[]}
      schools={null}
    />
  );
}
