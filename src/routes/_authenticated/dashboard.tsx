import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Karawhiua" },
      { name: "description", content: "Your Karawhiua Virtual Sports Day dashboard." },
    ],
  }),
  component: Dashboard,
});

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  school_id: string | null;
  house_id: string | null;
  role: string | null;
};

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, username, school_id, house_id, role")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) toast.error(error.message);
      setProfile(data ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user.id]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-green-soft">Karawhiua</p>
            <h1 className="text-3xl font-bold text-brand-green">Kia ora{profile?.first_name ? `, ${profile.first_name}` : ""}</h1>
          </div>
          <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loading ? (
              <p>Loading…</p>
            ) : profile ? (
              <>
                <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
                <p><span className="text-muted-foreground">Name:</span> {profile.first_name} {profile.last_name}</p>
                <p><span className="text-muted-foreground">Username:</span> {profile.username ?? "—"}</p>
                <p><span className="text-muted-foreground">Role:</span> {profile.role ?? "—"}</p>
                <p><span className="text-muted-foreground">School:</span> {profile.school_id ?? "Not selected"}</p>
                <p><span className="text-muted-foreground">House:</span> {profile.house_id ?? "Not selected"}</p>
              </>
            ) : (
              <p className="text-destructive">
                No user record yet. <Link to="/auth" className="underline">Complete signup</Link>.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming soon</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Activity logging, leaderboards, events, and admin tools land in upcoming slices.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
