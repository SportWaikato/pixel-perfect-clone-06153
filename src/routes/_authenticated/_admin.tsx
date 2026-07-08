import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { UserInterface } from "@/models/users/interfaces/UserInterface";

export const Route = createFileRoute("/_authenticated/_admin")({
  beforeLoad: async ({ context }) => {
    const profile = context.profile as UserInterface | null;
    if (!profile || (profile.role !== "school_admin" && profile.role !== "super_admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
