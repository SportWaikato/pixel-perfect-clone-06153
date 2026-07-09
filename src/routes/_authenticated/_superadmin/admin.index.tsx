import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import AdminDashboardContent from "@/modules/admin/components/AdminDashboardContent";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { EventService } from "@/models/events/services/EventService";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/")({
  head: () => ({ meta: [{ title: "Admin — Karawhiua" }] }),
  component: Page,
});

interface DashboardData {
  platformStats: {
    totalSchools: number;
    totalUsers: number;
    totalActivities: number;
    totalHours: number;
    totalMinutes: number;
    topActivityType: string;
    topActivityCount: number;
    newSignupsThisWeek: number;
    activeEvents: number;
  };
  recentActivities: ActivityInterface[];
  schools: SchoolInterface[];
  events: EventInterface[];
}

function Page() {
  const { profile } = Route.useRouteContext();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const schoolService = new SchoolService(supabase);
    const eventService = new EventService(supabase);
    const activityService = new ActivityService(supabase);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    Promise.all([
      schoolService.getAllWithStats(true),
      eventService.getAll(),
      activityService.getRecentActivities(20),
      activityService.getTotalMinutes(),
      activityService.getActivityTypeCounts(),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_deleted", false)
        .then(({ count }) => count ?? 0),
      supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .then(({ count }) => count ?? 0),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo)
        .then(({ count }) => count ?? 0),
    ])
      .then(
        ([
          schools,
          events,
          recentActivities,
          totalMinutes,
          typeCounts,
          totalUsers,
          totalActivities,
          newSignupsThisWeek,
        ]) => {
          const top = typeCounts[0];
          setData({
            platformStats: {
              totalSchools: schools.length,
              totalUsers,
              totalActivities,
              totalMinutes,
              totalHours: Math.round(totalMinutes / 60),
              topActivityType: top?.activity_type ?? "—",
              topActivityCount: Number(top?.count ?? 0),
              newSignupsThisWeek,
              activeEvents: events.filter((e) => e.is_active && e.approval_status === "approved")
                .length,
            },
            recentActivities,
            schools,
            events,
          });
        },
      )
      .catch((err) => {
        notifyAboutError(err);
        setData({
          platformStats: {
            totalSchools: 0,
            totalUsers: 0,
            totalActivities: 0,
            totalHours: 0,
            totalMinutes: 0,
            topActivityType: "—",
            topActivityCount: 0,
            newSignupsThisWeek: 0,
            activeEvents: 0,
          },
          recentActivities: [],
          schools: [],
          events: [],
        });
      });
  }, []);

  if (!profile) return null;

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <AdminDashboardContent
      user={profile as UserInterface}
      platformStats={data.platformStats}
      recentActivities={data.recentActivities}
      schools={data.schools}
      events={data.events}
    />
  );
}
