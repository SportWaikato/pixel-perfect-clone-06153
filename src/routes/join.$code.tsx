import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/join/$code")({
  ssr: false,
  component: JoinByCode,
});

function JoinByCode() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  useEffect(() => {
    // TODO: validate code against schools / invites table, attach school_id to current user
    toast.info(`Join code ${code} — handler not yet implemented`);
    navigate({ to: "/onboarding" });
  }, [code, navigate]);
  return <div className="p-6 text-center">Processing join link…</div>;
}
