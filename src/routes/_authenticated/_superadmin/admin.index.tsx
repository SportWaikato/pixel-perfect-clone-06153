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
        dauResult,
        surveyResult,
        pendingResult,
      ] = await Promise.all([
        schoolService.getAll(true).catch(() => [] as SchoolInterface[]),
        eventService.getAll().catch(() => [] as EventInterface[]),
        activityService.getRecentActivities(20).catch(() => [] as ActivityInterface[]),
        activityService.getTotalMinutes().catch(() => 0),
        activityService.getActivityTypeCounts().catch(() => [] as { activity_type: string; count: number }[]),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("is_deleted", false).then(({ count }) => count ?? 0, () => 0),
        supabase.from("activities").select("id", { count: "exact", head: true }).then(({ count }) => count ?? 0, () => 0),
        supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", weekAgo).then(({ count }) => count ?? 0, () => 0),
        fetchDailyActiveUsers(supabase).catch(() => [] as { date: string; count: number }[]),
        fetchSurveyCompletion(supabase).catch(() => ({ completed: 0, total: 0 })),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("approval_status", "pending").then(({ count }) => count ?? 0, () => 0),
      ]);

      const activeSchools = schools.filter((s) => s.is_active).length;
      const schoolsWithTerms = schools.filter((s) => s.current_term_id).length;
      const activeThisWeek = dauResult.reduce((sum, d) => sum + d.count, 0);

      return {
        schools, events, recentActivities, totalMinutes, typeCounts,
        totalUsers, totalActivities, newSignupsThisWeek,
        dailyActiveUsers: dauResult,
        surveyCompletion: surveyResult,
        pendingEventCount: pendingResult,
        funnel: { registered: schools.length, withTerms: schoolsWithTerms, activeThisTerm: activeSchools, activeThisWeek },
      };
    } catch {
      return {
        schools: [] as SchoolInterface[], events: [] as EventInterface[],
        recentActivities: [] as ActivityInterface[], totalMinutes: 0,
        typeCounts: [] as { activity_type: string; count: number }[],
        totalUsers: 0, totalActivities: 0, newSignupsThisWeek: 0,
        dailyActiveUsers: [] as { date: string; count: number }[],
        surveyCompletion: { completed: 0, total: 0 },
        pendingEventCount: 0,
        funnel: { registered: 0, withTerms: 0, activeThisTerm: 0, activeThisWeek: 0 },
      };
    }
  },
  component: Page,
});

async function fetchDailyActiveUsers(
  supabase: ReturnType<typeof createSupabaseClient>,
): Promise<{ date: string; count: number }[]> {
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const nextStr = new Date(d.getTime() + 86400000).toISOString().split("T")[0];
    const { count } = await supabase
      .from("activities")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", dateStr)
      .lt("created_at", nextStr);
    days.push({ date: dateStr.slice(5), count: count ?? 0 });
  }
  return days;
}

async function fetchSurveyCompletion(
  supabase: ReturnType<typeof createSupabaseClient>,
): Promise<{ completed: number; total: number }> {
  const [{ count: total }, { count: completed }] = await Promise.all([
    supabase.from("user_survey_status").select("id", { count: "exact", head: true }),
    supabase.from("user_survey_status").select("id", { count: "exact", head: true }).eq("status", "completed"),
  ]);
  return { completed: completed ?? 0, total: total ?? 0 };
}

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
  const dailyActiveUsers = (ctx.dailyActiveUsers as { date: string; count: number }[]) || [];
  const surveyCompletion = (ctx.surveyCompletion as { completed: number; total: number }) || { completed: 0, total: 0 };
  const pendingEventCount = (ctx.pendingEventCount as number) || 0;
  const funnel = (ctx.funnel as { registered: number; withTerms: number; activeThisTerm: number; activeThisWeek: number }) || { registered: 0, withTerms: 0, activeThisTerm: 0, activeThisWeek: 0 };

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
      dailyActiveUsers={dailyActiveUsers}
      surveyCompletion={surveyCompletion}
      pendingEventCount={pendingEventCount}
      funnel={funnel}
    />
  );
}
