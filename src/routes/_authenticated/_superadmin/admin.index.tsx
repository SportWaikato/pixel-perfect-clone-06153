import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import AdminDashboardContent from "@/modules/admin/components/AdminDashboardContent";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { EventService } from "@/models/events/services/EventService";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/")({
  head: () => ({ meta: [{ title: "Admin — Karawhiua" }] }),
  beforeLoad: async () => {
    const supabase = createSupabaseClient();
    const schoolService = new SchoolService(supabase);
    const eventService = new EventService(supabase);
    const activityService = new ActivityService(supabase);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const empty = {
      schools: [] as SchoolInterface[],
      events: [] as EventInterface[],
      recentActivities: [] as ActivityInterface[],
      totalMinutes: 0,
      typeCounts: [] as { activity_type: string; count: number }[],
      totalUsers: 0,
      totalActivities: 0,
      newSignupsThisWeek: 0,
    };

    try {
      const [
        schools,
        events,
        recentActivities,
        totalMinutes,
        typeCounts,
        totalUsers,
        totalActivities,
        newSignupsThisWeek,
      ] = await Promise.all([
        schoolService.getAll(true).catch(() => [] as SchoolInterface[]),
        eventService.getAll().catch(() => [] as EventInterface[]),
        activityService.getRecentActivities(20).catch(() => [] as ActivityInterface[]),
        activityService.getTotalMinutes().catch(() => 0),
        activityService
          .getActivityTypeCounts()
          .catch(() => [] as { activity_type: string; count: number }[]),
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("is_deleted", false)
          .then(
            ({ count }) => count ?? 0,
            () => 0,
          ),
        supabase
          .from("activities")
          .select("id", { count: "exact", head: true })
          .then(
            ({ count }) => count ?? 0,
            () => 0,
          ),
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .gte("created_at", weekAgo)
          .then(
            ({ count }) => count ?? 0,
            () => 0,
          ),
      ]);

      return {
        schools,
        events,
        recentActivities,
        totalMinutes,
        typeCounts,
        totalUsers,
        totalActivities,
        newSignupsThisWeek,
      };
    } catch {
      return empty;
    }
  },
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const ctx = Route.useRouteContext() as Record<string, unknown>;
  const schools = (ctx.schools as SchoolInterface[]) || [];
  const events = (ctx.events as EventInterface[]) || [];
  const recentActivities = (ctx.recentActivities as ActivityInterface[]) || [];
  const totalMinutes = (ctx.totalMinutes as number) || 0;
  const typeCounts = (ctx.typeCounts as { activity_type: string; count: number }[]) || [];
  const totalUsers = (ctx.totalUsers as number) || 0;
  const totalActivities = (ctx.totalActivities as number) || 0;
  const newSignupsThisWeek = (ctx.newSignupsThisWeek as number) || 0;

  if (!profile) return null;

  const top = typeCounts[0];

  return (
    <AdminDashboardContent
      user={profile as UserInterface}
      platformStats={{
        totalSchools: schools.length,
        totalUsers,
        totalActivities,
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60),
        topActivityType: top?.activity_type ?? "—",
        topActivityCount: Number(top?.count ?? 0),
        newSignupsThisWeek,
        activeEvents: events.filter((e) => e.is_active && e.approval_status === "approved").length,
      }}
      recentActivities={recentActivities}
      schools={schools}
      events={events}
    />
  );
}
