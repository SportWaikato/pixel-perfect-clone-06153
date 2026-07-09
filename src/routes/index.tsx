import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });

    const { data: profile } = await supabase
      .from("users")
      .select("school_id, house_id, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) throw redirect({ to: "/onboarding" });

    if (profile.role === "super_admin") throw redirect({ to: "/admin" });
    if (!profile.school_id) throw redirect({ to: "/onboarding" });
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
