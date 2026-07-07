import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import SuperAdminInviteSection from "@/modules/admin/components/SuperAdminInviteSection";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SuperAdminInviteInterface } from "@/models/invites/interfaces/SuperAdminInviteInterface";

const loadInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SuperAdminInviteInterface[]> => {
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (caller?.role !== "super_admin") return [];

    const { InviteService } = await import("@/models/invites/services/InviteService");
    const service = new InviteService(context.supabase);
    return service.list();
  });

export const Route = createFileRoute("/_authenticated/_superadmin/admin/invites")({
  head: () => ({ meta: [{ title: "Super Admin Invites — Karawhiua" }] }),
  loader: () => loadInvites(),
  component: Page,
});

function Page() {
  const initialInvites = Route.useLoaderData();
  return <SuperAdminInviteSection initialInvites={initialInvites} />;
}
