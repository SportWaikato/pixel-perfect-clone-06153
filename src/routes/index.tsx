import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import LandingPage from "@/modules/landing/LandingPage";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    // Logged-in users skip the marketing page and go to their home.
    const { data } = await supabase.auth.getUser();
    if (!data.user) return; // logged out → render the landing page below

    const { data: profile } = await supabase
      .from("users")
      .select("school_id, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) throw redirect({ to: "/onboarding" });
    if (profile.role === "super_admin") throw redirect({ to: "/admin" });
    if (!profile.school_id) throw redirect({ to: "/onboarding" });
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Karawhiua — Go For It! | The new way to sports day" },
      {
        name: "description",
        content:
          "Karawhiua is a school movement challenge from Sport Waikato. Log any activity, earn points for your House, and compete with schools across Aotearoa — no travel, no cost barrier, everyone counts.",
      },
    ],
  }),
  component: LandingPage,
});
