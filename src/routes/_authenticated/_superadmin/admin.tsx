import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_superadmin/admin")({
  head: () => ({ meta: [{ title: "Admin — Karawhiua" }] }),
  component: () => <Outlet />,
});
