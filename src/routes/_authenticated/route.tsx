import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { UserInterface } from "@/models/users/interfaces/UserInterface";
import ConditionalNavigation from "@/modules/application/components/Navigation/ConditionalNavigation";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", auth.user.id)
      .maybeSingle();

    const isSuperAdmin = profile?.role === "super_admin";
    const needsOnboarding = !profile || (!profile.school_id && !isSuperAdmin);
    if (needsOnboarding && !location.pathname.startsWith("/onboarding")) {
      throw redirect({ to: "/onboarding" });
    }

    return {
      authUser: auth.user,
      profile: (profile ?? null) as unknown as UserInterface | null,
    };
  },
  component: () => (
    <>
      <ConditionalNavigation />
      <Outlet />
    </>
  ),
});
