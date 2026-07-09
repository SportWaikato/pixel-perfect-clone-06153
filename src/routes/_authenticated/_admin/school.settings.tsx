import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolTermInterface } from "@/models/terms/interfaces/SchoolTermInterface";
import TermManagementContent from "@/modules/admin/components/settings/TermManagementContent";
import { SchoolTermService } from "@/models/terms/services/SchoolTermService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";

export const Route = createFileRoute("/_authenticated/_admin/school/settings")({
  head: () => ({ meta: [{ title: "School Settings — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const user = profile as UserInterface | null;
  const schoolId = user?.school_id ?? "";
  const [terms, setTerms] = useState<SchoolTermInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const termService = useMemo(() => new SchoolTermService(createSupabaseClient()), []);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    termService
      .getBySchoolId(schoolId)
      .then(setTerms)
      .catch(() => setTerms([]))
      .finally(() => setLoading(false));
  }, [schoolId, termService]);

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
          School Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your competition terms and reset the House leaderboard at the end of each term.
          Students always keep their own activity history and earned badges.
        </p>
      </div>

      {!schoolId ? (
        <p className="text-gray-500">Your account isn't linked to a school yet.</p>
      ) : loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <TermManagementContent terms={terms} schoolId={schoolId} currentUser={user} />
      )}
    </div>
  );
}
