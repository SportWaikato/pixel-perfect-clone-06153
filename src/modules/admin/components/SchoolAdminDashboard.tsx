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
  Calendar,
  TrendingUp,
  Award,
  Copy,
  Check,
  Link as LinkIcon,
  Clock,
  ShieldAlert,
  Activity,
  MessageSquare,
  Crown,
  QrCode,
  Monitor,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/modules/application/components/DesignSystem/ui/dialog";
import { Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { UserService } from "@/models/users/services/UserService";
import { EventService } from "@/models/events/services/EventService";
import { SchoolMessageService } from "@/models/schoolMessages/services/SchoolMessageService";
import { LeaderboardService } from "@/models/leaderboards/services/LeaderboardService";
import { toast } from "sonner";
import ActivityLogPreview from "./ActivityLogPreview";
import { regenerateJoinCode } from "@/lib/registration.functions";

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
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [joinCopied, setJoinCopied] = useState(false);
  const [joinCodeLoading, setJoinCodeLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateModal, setRegenerateModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const signUpUrl =
    typeof window !== "undefined" ? `${window.location.origin}/schools/${schoolId}/signup` : "";

  useEffect(() => {
    if (!schoolId) return;

    const fetchAllStats = async () => {
      try {
        const supabase = createSupabaseClient();
        const userService = new UserService(supabase);
        const eventService = new EventService(supabase);
        const leaderboardService = new LeaderboardService(supabase);
        const messageService = new SchoolMessageService(supabase);

        const [userStats, pendingCount, leaderboard, messageCount] = await Promise.all([
          userService.getSchoolUserStats(schoolId),
          eventService.getPendingCountForSchool(schoolId),
          leaderboardService.getSchoolLeaderboard(schoolId),
          messageService.countUnreadBySchoolId(schoolId),
        ]);

        const schoolEntry = leaderboard.find((entry) => entry.id === schoolId);

        setStats({
          totalUsers: userStats.total,
          activeUsers: userStats.active,
          messageCount,
          pendingEvents: pendingCount,
          schoolRank: schoolEntry?.rank ?? 0,
          totalMinutes: userStats.totalMinutes,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [schoolId]);

  // Fetch join code
  useEffect(() => {
    if (!schoolId) {
      setJoinCodeLoading(false);
      return;
    }
    const loadJoinCode = async () => {
      try {
        const sb = createSupabaseClient();
        const { data } = await sb.rpc("get_school_join_code", {
          p_school_id: schoolId,
        });
        const codeData = data as unknown as { join_code: string } | null;
        setJoinCode(codeData?.join_code || null);
      } catch {
        setJoinCode(null);
      } finally {
        setJoinCodeLoading(false);
      }
    };
    loadJoinCode();
  }, [schoolId]);

  const handleCopyJoinLink = async () => {
    const url = `${window.location.origin}/join/${joinCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setJoinCopied(true);
      toast.success("Join link copied to clipboard!");
      setTimeout(() => setJoinCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleRegenerateJoinCode = async () => {
    if (!schoolId) return;
    setRegenerating(true);
    try {
      const { regenerateJoinCode } = await import("@/lib/registration.functions");
      const result = await regenerateJoinCode({ data: { schoolId } });
      setJoinCode(result.joinCode);
      toast.success("New join link generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate link");
    }
    setRegenerating(false);
    setRegenerateModal(false);
  };

  const handleCopySignUpUrl = async () => {
    const url = `${window.location.origin}/schools/${schoolId}/signup`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Sign up URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL to clipboard");
    }
  };

  const renderQrCode = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = `${window.location.origin}/schools/${schoolId}/signup`;
    await QRCode.toCanvas(canvas, url, { width: 280, margin: 2 });
  }, [schoolId]);

  useEffect(() => {
    if (qrModalOpen) {
      setTimeout(renderQrCode, 50);
    }
  }, [qrModalOpen, renderQrCode]);

  const handleCopyQrCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setQrCopied(true);
        toast.success("QR code copied to clipboard!");
        setTimeout(() => setQrCopied(false), 2000);
      });
    } catch {
      toast.error("Failed to copy QR code to clipboard");
    }
  };

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

  const isSuperAdmin = user.role === "super_admin";
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
      title: "Manage Challenges",
      description: "Review pending challenges",
      href: "/school/events",
      icon: Clock,
      color: "bg-orange-500",
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
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        {viewingSchoolId && (
          <div className="mb-3">
            <Link to="/admin/schools" className="text-sm text-blue-600 hover:underline">
              ← Back to all schools
            </Link>
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900">School Admin Dashboard</h1>
        <p className="text-gray-600">Managing {schoolName}</p>
      </div>

      {/* School Join Link */}
      {!joinCodeLoading && joinCode && (
        <Card className="border-brand-green/30 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkIcon size={18} className="text-brand-green" />
              Your School Join Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-brand-green/20 break-all">
                {typeof window !== "undefined" && `${window.location.origin}/join/${joinCode}`}
              </code>
              <Button
                size="sm"
                onClick={handleCopyJoinLink}
                className="bg-brand-green text-white hover:bg-brand-green-soft shrink-0"
              >
                {joinCopied ? <Check size={14} /> : <Copy size={14} />}
                {joinCopied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with students so they can join {schoolName}.{" "}
              <button
                type="button"
                onClick={() => setRegenerateModal(true)}
                className="underline text-brand-green cursor-pointer"
              >
                Regenerate link
              </button>
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={regenerateModal} onOpenChange={setRegenerateModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Regenerate join link?</DialogTitle>
            <p className="text-sm text-gray-500">
              This will invalidate the current link. Students with the old link cannot use it.
            </p>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRegenerateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateJoinCode}
              disabled={regenerating}
              className="bg-brand-green text-white hover:bg-brand-green-soft"
            >
              {regenerating ? "Regenerating…" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.totalMinutes)} minutes</div>
            <p className="text-xs text-muted-foreground">All student activities</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Koorero</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.messageCount}</div>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </div>
            <Button asChild className="w-full mt-4" style={{ backgroundColor: "#0B4B39" }}>
              <Link to="/school/updates">Manage messages</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Rank</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{stats.schoolRank}</div>
            <p className="text-xs text-muted-foreground">In district</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      {action.badge > 0 && (
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

          {/* Copy Sign Up URL Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500 text-white">
                    <LinkIcon size={20} />
                  </div>
                  <span>Sign Up URL</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Share the sign up link with new students</p>
              <Button
                onClick={handleCopySignUpUrl}
                className="w-full gap-2"
                style={{ backgroundColor: "#1B5E4B" }}
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Sign Up URL
                  </>
                )}
              </Button>
              <Button
                onClick={() => setQrModalOpen(true)}
                className="w-full gap-2 mt-2"
                style={{ backgroundColor: "#1B5E4B" }}
              >
                <QrCode size={16} />
                Generate QR Code
              </Button>
            </CardContent>
          </Card>

          <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Print or share invite</DialogTitle>
                <p className="text-sm text-gray-500">
                  Share this QR code with your students to help them register with Karawhiua
                </p>
              </DialogHeader>
              <div className="flex justify-center py-2">
                <canvas ref={canvasRef} className="rounded-lg" />
              </div>
              <Button
                onClick={handleCopyQrCode}
                className="w-full gap-2"
                style={{ backgroundColor: "#1B5E4B" }}
              >
                {qrCopied ? (
                  <>
                    <Check size={16} className="text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy QR Code to Clipboard
                  </>
                )}
              </Button>
            </DialogContent>
          </Dialog>
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
