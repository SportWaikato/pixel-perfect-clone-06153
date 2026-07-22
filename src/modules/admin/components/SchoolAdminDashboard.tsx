import { UserInterface } from "@/models/users/interfaces/UserInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import {
  Users,
  Clock,
  Calendar,
  TrendingUp,
  Award,
  MessageSquare,
  Crown,
  Monitor,
  ShieldAlert,
  Activity,
  Settings,
  CalendarClock,
  Trophy,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { UserService } from "@/models/users/services/UserService";
import { EventService } from "@/models/events/services/EventService";
import { SchoolMessageService } from "@/models/schoolMessages/services/SchoolMessageService";
import { LeaderboardService } from "@/models/leaderboards/services/LeaderboardService";
import { HouseLeaderboardEntry } from "@/models/leaderboards/interfaces/LeaderboardInterface";
import { SchoolTermInterface } from "@/models/terms/interfaces/SchoolTermInterface";
import { SchoolTermService } from "@/models/terms/services/SchoolTermService";
import ActivityLogPreview from "./ActivityLogPreview";
import { m } from "framer-motion";

const statCardSpring = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

const nzDateString = (date: Date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(date);

interface SchoolAdminDashboardProps {
  user: UserInterface;
  viewingSchoolId?: string;
  viewingSchoolName?: string;
  viewingSchoolRegistrationMethod?: "domain_blocklist" | "allowlist";
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  messageCount: number;
  pendingEvents: number;
  schoolRank: number;
  totalMinutes: number;
}

const SchoolAdminDashboard = ({
  user,
  viewingSchoolId,
  viewingSchoolName,
  viewingSchoolRegistrationMethod,
}: SchoolAdminDashboardProps) => {
  const schoolId = viewingSchoolId || user.school_id;
  const schoolName = viewingSchoolName || user.school?.name;
  const registrationMethod =
    viewingSchoolRegistrationMethod ?? user.school?.registration_method ?? "domain_blocklist";
  const isAllowList = registrationMethod === "allowlist";
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    messageCount: 0,
    pendingEvents: 0,
    schoolRank: 0,
    totalMinutes: 0,
  });
  const [houses, setHouses] = useState<HouseLeaderboardEntry[]>([]);
  const [currentTerm, setCurrentTerm] = useState<SchoolTermInterface | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;

    const fetchAllStats = async () => {
      try {
        const supabase = createSupabaseClient();
        const userService = new UserService(supabase);
        const eventService = new EventService(supabase);
        const leaderboardService = new LeaderboardService(supabase);
        const messageService = new SchoolMessageService(supabase);
        const termService = new SchoolTermService(supabase);

        const [userStats, pendingCount, leaderboard, messageCount, houseBoard, terms] =
          await Promise.all([
            userService.getSchoolUserStats(schoolId),
            eventService.getPendingCountForSchool(schoolId),
            leaderboardService.getSchoolLeaderboard(schoolId),
            messageService.countUnreadBySchoolId(schoolId),
            leaderboardService.getHouseLeaderboard(schoolId),
            termService.getBySchoolId(schoolId),
          ]);

        const schoolEntry = leaderboard.find((entry) => entry.id === schoolId);
        const today = nzDateString();

        setStats({
          totalUsers: userStats.total,
          activeUsers: userStats.active,
          messageCount,
          pendingEvents: pendingCount,
          schoolRank: schoolEntry?.rank ?? 0,
          totalMinutes: userStats.totalMinutes,
        });
        setHouses(houseBoard);
        setCurrentTerm(terms.find((t) => t.start_date <= today && today <= t.end_date) ?? null);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [schoolId]);

  const isSuperAdmin = user.role === "super_admin";

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const engagementRate =
    stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;
  const maxHousePoints = Math.max(1, ...houses.map((h) => h.term_points || h.total_points || 0));
  const currentWeek = currentTerm ? SchoolTermService.getCurrentWeekNumber(currentTerm) : 0;
  const totalWeeks = currentTerm ? SchoolTermService.getTotalWeeks(currentTerm) : 0;
  const daysUntilReset = currentTerm
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${currentTerm.end_date}T23:59:59+12:00`).getTime() - Date.now()) / 86400000,
        ),
      )
    : 0;

  const quickActions = [
    // Houses management only exists as a super-admin page; hide it for school
    // admins rather than bouncing them off the _superadmin route gate.
    ...(isSuperAdmin
      ? [
          {
            title: "Manage Houses",
            description: "Add and edit house teams",
            href: "/admin/houses",
            icon: Crown,
            color: "bg-purple-500",
            badge: 0,
          },
        ]
      : []),
    {
      title: "Manage Students",
      description: "Edit profiles, houses, year groups",
      href: "/school/users",
      icon: Users,
      color: "bg-blue-600",
      badge: 0,
      needsAttention: false,
    },
    {
      title: "Manage Challenges",
      description: "Review pending challenges",
      href: "/school/events",
      icon: Clock,
      color: "bg-brand-magenta",
      badge: stats.pendingEvents,
      needsAttention: stats.pendingEvents > 0,
      secondaryHref: "/challenges",
      secondaryLabel: "View challenges",
    },
    {
      title: "Activity Log",
      description: "View and moderate activity logs",
      href: "/school/activity",
      icon: Activity,
      color: "bg-red-500",
      badge: 0,
      needsAttention: false,
    },
    {
      title: "Term Dates",
      description: "Set terms & leaderboard resets",
      href: "/school/settings",
      icon: CalendarClock,
      color: "bg-teal-600",
      badge: 0,
      needsAttention: !currentTerm,
    },
    {
      title: "Assembly Mode",
      description: "Present live updates to the school",
      href: "/school/assembly",
      icon: Monitor,
      color: "bg-[#1B5E4B]",
      badge: 0,
      needsAttention: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      {viewingSchoolId && (
        <Link to="/admin/schools" className="text-sm text-blue-600 hover:underline">
          ← Back to all schools
        </Link>
      )}
      <div
        className="rounded-2xl px-6 py-6 text-white"
        style={{ background: "linear-gradient(110deg, #0c4036 0%, #1B5E4B 55%, #118061 100%)" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight">
              School Admin Dashboard
            </h1>
            <p className="text-white/70 mt-1">Managing {schoolName}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {currentTerm ? (
              <Badge className="bg-white/15 text-white border-white/20 backdrop-blur px-3 py-1.5">
                <CalendarClock size={14} className="mr-1.5" />
                Week {currentWeek} of {totalWeeks} · Term {currentTerm.term_number}{" "}
                {currentTerm.year}
              </Badge>
            ) : (
              <Link to="/school/settings">
                <Badge className="bg-brand-magenta text-white border-0 px-3 py-1.5 cursor-pointer hover:opacity-90">
                  <ShieldAlert size={14} className="mr-1.5" />
                  No term set — configure term dates
                </Badge>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <m.div {...statCardSpring} transition={{ ...statCardSpring.transition, delay: 0 }}>
          <Link to="/school/users" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-medium">Total Students</CardTitle>
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-xl font-bold">{stats.totalUsers}</div>
                <p className="text-[10px] text-muted-foreground">
                  {stats.activeUsers} active · {engagementRate}% engaged
                </p>
              </CardContent>
            </Card>
          </Link>
        </m.div>

        <m.div {...statCardSpring} transition={{ ...statCardSpring.transition, delay: 0.05 }}>
          <Link to="/leaderboard" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-medium">School Total</CardTitle>
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-xl font-bold">{Math.round(stats.totalMinutes)}m</div>
                <p className="text-[10px] text-muted-foreground">All activities</p>
              </CardContent>
            </Card>
          </Link>
        </m.div>

        <m.div {...statCardSpring} transition={{ ...statCardSpring.transition, delay: 0.1 }}>
          <Link to="/school/updates" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-medium">Announcements</CardTitle>
                <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-xl font-bold">{stats.messageCount}</div>
                <p className="text-[10px] text-muted-foreground">Unread messages</p>
              </CardContent>
            </Card>
          </Link>
        </m.div>

        <m.div {...statCardSpring} transition={{ ...statCardSpring.transition, delay: 0.15 }}>
          <Link to="/leaderboard" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-medium">School Rank</CardTitle>
                <Award className="h-3.5 w-3.5 text-brand-magenta" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-xl font-bold">#{stats.schoolRank}</div>
                <p className="text-[10px] text-muted-foreground">Inter-school ladder</p>
              </CardContent>
            </Card>
          </Link>
        </m.div>
      </div>

      {/* House standings + term tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-brand-magenta" />
              House Standings — this term
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {houses.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No houses yet. Houses are set up during onboarding.
              </p>
            ) : (
              houses.map((house, i) => {
                const points = house.term_points || house.total_points || 0;
                return (
                  <div key={house.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-semibold text-gray-700">
                        <span className="text-xs text-gray-400 w-4">#{i + 1}</span>
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: house.color || "#1B5E4B" }}
                        />
                        {house.name}
                      </span>
                      <span className="font-bold text-gray-800">
                        {points.toLocaleString()} pts
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          {house.member_count} members
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <m.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: house.color || "#1B5E4B" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(2, (points / maxHousePoints) * 100)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="h-4 w-4 text-[#1B5E4B]" />
              Term Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentTerm ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-black text-[#1B5E4B]">{daysUntilReset}</div>
                  <p className="text-xs text-gray-500 mt-1">days until the leaderboard resets</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>
                      Week {currentWeek} of {totalWeeks}
                    </span>
                    <span>
                      Ends{" "}
                      {new Date(`${currentTerm.end_date}T12:00:00+12:00`).toLocaleDateString(
                        "en-NZ",
                        { day: "numeric", month: "short" },
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <m.div
                      className="h-2 rounded-full"
                      style={{ background: "linear-gradient(90deg, #1B5E4B, #D103D1)" }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${totalWeeks > 0 ? Math.min(100, (currentWeek / totalWeeks) * 100) : 0}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  House and school term points reset at term end and are archived to term history.
                  Students always keep their lifetime points, streaks and badges.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full gap-2">
                  <Link to="/school/settings">
                    <Settings className="h-4 w-4" /> Manage term dates
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-center py-2">
                <p className="text-sm text-gray-500">
                  No current term configured. Term dates power weekly assembly scores and
                  leaderboard resets.
                </p>
                <Button asChild size="sm" className="gap-2 bg-brand-magenta hover:opacity-90">
                  <Link to="/school/settings">
                    <Calendar className="h-4 w-4" /> Set term dates
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Card key={action.href} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <IconComponent size={20} />
                      </div>
                      <span>{action.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(action.badge ?? 0) > 0 && (
                        <Badge
                          variant={action.needsAttention ? "default" : "secondary"}
                          className={`flex items-center gap-1 ${action.needsAttention ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                        >
                          {action.needsAttention && <Calendar size={12} />}
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{action.description}</p>
                  <Button asChild className="w-full" style={{ backgroundColor: "#1B5E4B" }}>
                    <Link to={action.href}>Open {action.title}</Link>
                  </Button>
                  {action.secondaryHref && (
                    <Button asChild variant="outline" className="w-full mt-2">
                      <Link to={action.secondaryHref}>{action.secondaryLabel}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Preview */}
      <ActivityLogPreview schoolId={schoolId} />

      {/* Registration method — allowlist management only exists as a super-admin
          page; hide the card for school admins rather than bouncing them off
          the _superadmin route gate. */}
      {isSuperAdmin && (
        <Card className={isAllowList ? "border-green-100" : "border-red-100"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg text-white ${isAllowList ? "bg-green-600" : "bg-red-500"}`}
              >
                <ShieldAlert size={18} />
              </div>
              <div>
                <CardTitle>{isAllowList ? "Allow List" : "Block List"}</CardTitle>
                <p className="text-sm text-gray-600 mt-0.5">Control which students can register</p>
              </div>
            </div>
            <Button asChild style={{ backgroundColor: "var(--brand-primary-green)" }}>
              <Link to="/admin/allowlist">
                {isAllowList ? "Manage Allow List" : "Manage Block List"}
              </Link>
            </Button>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default SchoolAdminDashboard;
