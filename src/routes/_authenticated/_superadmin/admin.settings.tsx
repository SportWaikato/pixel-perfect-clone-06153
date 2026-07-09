import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { SchoolTermInterface } from "@/models/terms/interfaces/SchoolTermInterface";
import TermManagementContent from "@/modules/admin/components/settings/TermManagementContent";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { SchoolTermService } from "@/models/terms/services/SchoolTermService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/application/components/DesignSystem/ui/select";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Karawhiua" }] }),
  beforeLoad: async () => {
    const supabase = createSupabaseClient();
    const schoolService = new SchoolService(supabase);
    const schools = await schoolService.getAll(true).catch(() => [] as SchoolInterface[]);
    return { schools };
  },
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const ctx = Route.useRouteContext() as Record<string, unknown>;
  const schools = (ctx.schools as SchoolInterface[]) || [];
  const user = profile as UserInterface;

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    user.school_id || schools[0]?.id || "",
  );
  const [terms, setTerms] = useState<SchoolTermInterface[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);

  const termService = useMemo(() => new SchoolTermService(createSupabaseClient()), []);

  useEffect(() => {
    if (!selectedSchoolId) {
      setTerms([]);
      return;
    }
    setLoadingTerms(true);
    termService
      .getBySchoolId(selectedSchoolId)
      .then(setTerms)
      .catch(() => setTerms([]))
      .finally(() => setLoadingTerms(false));
  }, [selectedSchoolId, termService]);

  if (!profile) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">School Term Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage term dates for each school. Terms are used for point tracking and leaderboard
          periods.
        </p>
      </div>

      <div className="max-w-xs">
        <label className="text-sm font-medium text-gray-700 mb-1 block">Select School</label>
        <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a school…" />
          </SelectTrigger>
          <SelectContent>
            {schools.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedSchoolId ? (
        <p className="text-gray-500">Select a school above to manage its terms.</p>
      ) : loadingTerms ? (
        <p className="text-gray-500">Loading terms…</p>
      ) : (
        <TermManagementContent terms={terms} schoolId={selectedSchoolId} currentUser={user} />
      )}
    </div>
  );
}
