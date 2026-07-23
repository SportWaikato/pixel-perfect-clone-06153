import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import ReportsContent from "@/modules/admin/components/ReportsContent";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Karawhiua" }] }),
  // Load the school list so super admins can pick a school to report on.
  // Without this the school selector is empty, leaving Generate/Export
  // permanently disabled.
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
  if (!profile) return null;
  return <ReportsContent user={profile as UserInterface} schools={schools} currentTerm={null} />;
}
