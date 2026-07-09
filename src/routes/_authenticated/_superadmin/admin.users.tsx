import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import UserManagementContent from "@/modules/admin/components/UserManagementContent";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/users")({
  head: () => ({ meta: [{ title: "Users — Karawhiua" }] }),
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
  return (
    <UserManagementContent
      user={profile as UserInterface}
      backHref="/admin"
      schools={schools}
      initialInvites={[]}
    />
  );
}
