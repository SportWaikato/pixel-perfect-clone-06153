import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import InviteRegistrationForm from "@/modules/invite/components/InviteRegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InviteState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "used" }
  | { status: "valid"; email: string };

export const Route = createFileRoute("/invite/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "Super admin invite — Karawhiua" }] }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const [state, setState] = useState<InviteState>({ status: "loading" });

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_super_admin_invite", {
          p_token: token,
        });
        if (error) throw error;
        const invite = Array.isArray(data) ? data[0] : data;
        if (!invite) return setState({ status: "invalid" });
        if (invite.used_at) return setState({ status: "used" });
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
          return setState({ status: "expired" });
        }
        setState({ status: "valid", email: invite.email });
      } catch {
        setState({ status: "invalid" });
      }
    })();
  }, [token]);

  const problem =
    state.status === "invalid"
      ? "This invite link isn't valid."
      : state.status === "expired"
        ? "This invite link has expired."
        : state.status === "used"
          ? "This invite has already been used."
          : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-grey p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-brand-green-soft">Karawhiua</p>
          <h1 className="text-3xl font-bold text-brand-green">Virtual Sports Day</h1>
          <p className="mt-1 text-sm text-muted-foreground">Super admin registration</p>
        </div>

        <Card>
          {state.status === "loading" && (
            <CardContent className="py-10 text-center text-muted-foreground">
              Checking your invite…
            </CardContent>
          )}

          {problem && (
            <>
              <CardHeader>
                <CardTitle>Invite unavailable</CardTitle>
                <CardDescription>{problem}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  Ask the person who invited you to send a new link, or{" "}
                  <Link to="/auth" className="text-primary underline">
                    sign in
                  </Link>{" "}
                  if you already have an account.
                </p>
              </CardContent>
            </>
          )}

          {state.status === "valid" && (
            <>
              <CardHeader>
                <CardTitle>Create your super admin account</CardTitle>
                <CardDescription>Invited as {state.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <InviteRegistrationForm email={state.email} token={token} />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
