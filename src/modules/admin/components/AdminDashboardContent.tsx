import * as React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import ActivityExportDialog from "./ActivityExportDialog";

const SchoolPerformanceChart = React.lazy(() => import("./SchoolPerformanceChart"));
import SuperAdminMessagesSection from "./SuperAdminMessagesSection";
import {
  Users,
  School,
  Activity,
  TrendingUp,
  Download,
  Zap,
  ClipboardList,
  BarChart3,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Building2,
  UserPlus,
  Target,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getActivityIcon, getActivityColor } from "@/modules/activities/utils/activityIcons";
import { m } from "framer-motion";
import MovementDiscrepancyCard from "@/modules/reports/components/MovementDiscrepancyCard";
import PageHeader from "@/modules/application/components/Layout/PageHeader";

interface PlatformStats {
  totalSchools: number;
  totalUsers: number;
  totalActivities: number;
  totalHours: number;
  totalMinutes: number;
  topActivityType: string;
  topActivityCount: number;
  newSignupsThisWeek: number;
  activeEvents: number;
}

interface AdminDashboardContentProps {
  user: UserInterface;
  platformStats: PlatformStats;
  recentActivities: ActivityInterface[];
  schools: SchoolInterface[];
  events: EventInterface[];
  dailyActiveUsers: { date: string; count: number }[];
  surveyCompletion: { completed: number; total: number };
  pendingEventCount: number;
  funnel: { registered: number; withTerms: number; activeThisTerm: number; activeThisWeek: number };
}

const statCardSpring = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

const AdminDashboardContent = ({
  user,
  platformStats,
  recentActivities,
  schools,
  events,
  dailyActiveUsers,
  surveyCompletion,
  pendingEventCount,
  funnel,
}: AdminDashboardContentProps) => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const maxDau = Math.max(1, ...dailyActiveUsers.map((d) => d.count));
  const surveyRate =
    surveyCompletion.total > 0
      ? Math.round((surveyCompletion.completed / surveyCompletion.total) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Platform overview, analytics, and management tools"
        icon={BarChart3}
        actions={
          <Badge variant="secondary" className="text-sm px-3 py-1">
            Super Admin
          </Badge>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Schools",
            value: platformStats.totalSchools,
            sub: "Active schools",
            icon: School,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Total Students",
            value: platformStats.totalUsers.toLocaleString(),
            sub: `+${platformStats.newSignupsThisWeek} this week`,
            icon: Users,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Activities",
            value: platformStats.totalActivities.toLocaleString(),
            sub: "Total logged",
            icon: Activity,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Total Time",
            value: `${platformStats.totalHours.toLocaleString()} hrs`,
            sub: `${Math.round(platformStats.totalHours / 24)} days`,
            icon: Clock,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            label: "Top Activity",
            value: platformStats.topActivityType.replace(/_/g, " "),
            sub: `${platformStats.topActivityCount} logged`,
            icon: TrendingUp,
            color: "text-pink-600",
            bg: "bg-pink-50",
          },
        ].map((stat, i) => (
          <m.div
            key={stat.label}
            {...statCardSpring}
            transition={{ ...statCardSpring.transition, delay: i * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </m.div>
        ))}
      </div>

      {/* Quick Actions Bar */}
      <Card className="bg-gradient-to-r from-[#1B5E4B]/5 to-[#D103D1]/5 border-[#1B5E4B]/10">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 mr-2">Quick Actions:</span>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to="/admin/schools">
                <Building2 size={14} /> New School
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to="/admin/events">
                <Target size={14} />
                Pending Events
                {pendingEventCount > 0 && (
                  <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0 h-4">
                    {pendingEventCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to="/admin/users">
                <UserPlus size={14} /> Add User
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to="/admin/reports">
                <BarChart3 size={14} /> View Reports
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to="/admin/settings">
                <Clock size={14} /> Term Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* School Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#1B5E4B]" />
                Top 10 Schools by Pro-rata Score
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ranked by average points per student on roll
              </p>
            </CardHeader>
            <CardContent>
              <React.Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
                <SchoolPerformanceChart schools={schools} />
              </React.Suspense>
            </CardContent>
          </Card>

          {/* Daily Active Users — 7 Day Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#1B5E4B]" />
                Daily Active Students (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-32">
                {dailyActiveUsers.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-700">{day.count}</span>
                    <m.div
                      className="w-full rounded-t-md bg-[#1B5E4B]"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(4, (day.count / maxDau) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                    />
                    <span className="text-[10px] text-gray-400">{day.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Stats */}
        <div className="space-y-6">
          {/* Regional Movement */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-[#1B5E4B]" />
                Movement by Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const regionData = new Map<string, { schools: number; students: number; minutes: number }>();
                schools.forEach((s) => {
                  const r = s.region || "Other";
                  const e = regionData.get(r) || { schools: 0, students: 0, minutes: 0 };
                  e.schools += 1;
                  e.students += s.total_students || 0;
                  e.minutes += (s as any).total_minutes || 0;
                  regionData.set(r, e);
                });
                const regions = [...regionData.entries()].sort((a, b) => b[1].minutes - a[1].minutes);
                const maxMins = Math.max(1, ...regions.map(([, d]) => d.minutes));
                if (regions.length === 0) return <p className="text-sm text-gray-500 text-center py-2">No school data yet.</p>;
                return (
                  <div className="space-y-2.5">
                    {regions.map(([region, data]) => (
                      <div key={region} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-700">{region}</span>
                          <span className="text-gray-400">{data.schools} school{data.schools !== 1 ? "s" : ""} · {Math.round(data.minutes / 60)}h</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <m.div className="h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, #1B5E4B, #118061)" }} initial={{ width: 0 }} animate={{ width: `${(data.minutes / maxMins) * 100}%` }} transition={{ duration: 0.6, delay: 0.1 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          {/* Survey Completion */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardList className="h-4 w-4 text-[#1B5E4B]" />
                Survey Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1B5E4B]">{surveyRate}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <m.div
                  className="h-2 rounded-full"
                  style={{ background: "linear-gradient(90deg, #1B5E4B, #D103D1)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${surveyRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {surveyCompletion.completed} of {surveyCompletion.total} triggered surveys completed
              </p>
            </CardContent>
          </Card>

          {/* School Adoption Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-[#1B5E4B]" />
                School Adoption Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Registered", value: funnel.registered, width: 100, color: "#1B5E4B" },
                {
                  label: "Terms set",
                  value: funnel.withTerms,
                  width: funnel.registered > 0 ? (funnel.withTerms / funnel.registered) * 100 : 0,
                  color: "#118061",
                },
                {
                  label: "Active this term",
                  value: funnel.activeThisTerm,
                  width:
                    funnel.registered > 0 ? (funnel.activeThisTerm / funnel.registered) * 100 : 0,
                  color: "#D103D1",
                },
                {
                  label: "Active this week",
                  value: funnel.activeThisWeek,
                  width:
                    funnel.registered > 0 ? (funnel.activeThisWeek / funnel.registered) * 100 : 0,
                  color: "#E019C3",
                },
              ].map((step) => (
                <div key={step.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{step.label}</span>
                    <span className="font-semibold text-gray-800">{step.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <m.div
                      className="h-1.5 rounded-full"
                      style={{ backgroundColor: step.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, step.width)}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-blue-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>PostHog Analytics</span>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {import.meta.env.VITE_POSTHOG_KEY ? "Connected" : "Off"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Active Challenges</span>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {events.filter((e) => e.is_active).length} running
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Active Schools</span>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {schools.filter((s) => s.is_active).length} of {schools.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Pending Approval</span>
                {pendingEventCount > 0 ? (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    {pendingEventCount} events
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle2 size={10} className="inline mr-1" />
                    Clear
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Movement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#1B5E4B]" />
            Movement Summary — All Schools
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real activity data from Karawhiua. Compare with survey responses at /admin/surveys.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(() => {
              const totalMinutes = schools.reduce((s, sc) => s + ((sc as any).total_minutes || 0), 0);
              const totalStudents = schools.reduce((s, sc) => s + (sc.total_students || 0), 0);
              const activeStudents = schools.reduce((s, sc) => s + (sc.total_students || 0), 0);
              const avgMinPerStudent = activeStudents > 0 ? Math.round(totalMinutes / activeStudents) : 0;
              const meets6hr = activeStudents > 0 ? Math.round((schools.filter((sc) => ((sc as any).total_minutes || 0) >= 360).length / schools.length) * 100) : 0;

              return (
                <>
                  <div className="text-center p-4 rounded-xl bg-[#1B5E4B]/5">
                    <div className="text-2xl font-black text-[#1B5E4B]">{Math.round(totalMinutes / 60).toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">Total Active Hours</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[#1B5E4B]/5">
                    <div className="text-2xl font-black text-[#1B5E4B]">{activeStudents.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">Active Students</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[#1B5E4B]/5">
                    <div className="text-2xl font-black text-[#1B5E4B]">{avgMinPerStudent}</div>
                    <p className="text-xs text-gray-500 mt-1">Avg Min/Student</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[#1B5E4B]/5">
                    <div className="text-2xl font-black text-[#1B5E4B]">{meets6hr}%</div>
                    <p className="text-xs text-gray-500 mt-1">Meet 6+ hrs/wk</p>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Survey vs Real Movement Discrepancy */}
      <MovementDiscrepancyCard compact />

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Recent Activity Across All Schools</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Latest activities from all participating students
              </p>
            </div>
            <Button
              onClick={() => setIsExportDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" /> Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent activities found</p>
            ) : (
              recentActivities.slice(0, 15).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: getActivityColor(activity.activity_type) }}
                  >
                    {getActivityIcon(activity.activity_type, 30)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {activity.user?.first_name} {activity.user?.last_name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.user?.school?.name}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.activity_type.replace("_", " ")}
                      {activity.duration_minutes && ` • ${activity.duration_minutes} min`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* School Messages */}
      <SuperAdminMessagesSection schools={schools} />

      <ActivityExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
};

export default AdminDashboardContent;
