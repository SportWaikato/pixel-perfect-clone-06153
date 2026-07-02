import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getHomePath, type UserRole } from "@/modules/auth/utils/roleUtils";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (cancelled) return;

          const userId = data.session.user.id;
          const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", userId)
            .maybeSingle();

          const role = (profile?.role ?? "student") as UserRole;
          const homePath = getHomePath(role);

          navigate({ to: homePath, replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      if (cancelled) return;
      toast.error("Sign-in did not complete. Please try again.");
      navigate({ to: "/auth", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Completing sign-in…
    </div>
  );
}
