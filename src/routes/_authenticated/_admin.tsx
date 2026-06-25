import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin")({
  beforeLoad: ({ context }) => {
    const profile = (context as { profile: { role?: string } | null }).profile;
    if (!profile || (profile.role !== "school_admin" && profile.role !== "super_admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
