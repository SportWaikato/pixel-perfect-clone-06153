import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import SchoolAdminDashboard from "@/modules/admin/components/SchoolAdminDashboard";

export const Route = createFileRoute("/_authenticated/_admin/school")({
  head: () => ({ meta: [{ title: "My School — Karawhiua" }] }),
  component: Layout,
});

function Layout() {
  const { profile } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!profile) return null;
  const user = profile as UserInterface;

  if (pathname === "/school") {
    return (
      <SchoolAdminDashboard
        user={user}
        viewingSchoolId={user.school_id}
        viewingSchoolName={user.school?.name ?? ""}
        viewingSchoolRegistrationMethod={user.school?.registration_method ?? undefined}
      />
    );
  }

  return <Outlet />;
}
