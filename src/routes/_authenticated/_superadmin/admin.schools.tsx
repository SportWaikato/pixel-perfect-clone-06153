import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/schools")({
  head: () => ({ meta: [{ title: "Schools — Karawhiua" }] }),
  component: () => <Outlet />,
});
