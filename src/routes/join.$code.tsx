import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/join/$code")({
  ssr: false,
  component: JoinByCode,
});

function JoinByCode() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from("schools")
        .select("id, name")
        .eq("join_code", code)
        .eq("is_active", true)
        .eq("join_link_active", true)
        .maybeSingle();

      if (err) { setError("Something went wrong. Please try again."); setLoading(false); return; }
      if (!data) { setError("This join link is invalid or has expired. Contact your school admin for a new link."); setLoading(false); return; }

      setSchool(data);

      const { data: { user } } = await supabase.auth.getUser();
      setAuthed(!!user);
      setLoading(false);
    })();
  }, [code]);

  const handleSignUp = () => {
    sessionStorage.setItem("join_code", code);
    navigate({ to: "/auth", search: { redirect: "/onboarding" } as any });
  };

  const handleSignIn = () => {
    sessionStorage.setItem("join_code", code);
    navigate({ to: "/auth", search: { redirect: "/onboarding" } as any });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="text-5xl mb-2">🔗</div>
            <CardTitle className="text-xl text-destructive">Join link invalid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error || "This join link is invalid or has expired."}</p>
            <p className="text-sm text-muted-foreground">Contact your school admin for a new link.</p>
            <Button asChild variant="outline">
              <Link to="/auth">Go to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="text-5xl mb-2">👋</div>
          <CardTitle className="text-2xl">
            Join{" "}
            <span style={{ color: "#0B4B39" }}>{school.name}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            on Karawhiua Virtual Sports Day
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {authed ? (
            <>
              <p className="text-sm text-muted-foreground">
                You're signed in. Complete your onboarding to join {school.name}.
              </p>
              <Button
                className="w-full text-white hover:opacity-90"
                style={{ backgroundColor: "#0B4B39" }}
                onClick={() => navigate({ to: "/onboarding" })}
              >
                Continue to onboarding
              </Button>
            </>
          ) : (
            <>
              <Button
                className="w-full text-white hover:opacity-90"
                style={{ backgroundColor: "#0B4B39" }}
                onClick={handleSignUp}
              >
                Sign up with email
              </Button>
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="underline cursor-pointer"
                  style={{ color: "#0B4B39" }}
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
