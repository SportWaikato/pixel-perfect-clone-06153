import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Users, Calendar, TrendingUp, Award, Copy, Check, Link as LinkIcon, Clock, ShieldAlert, Activity, MessageSquare, Crown, QrCode, Monitor } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/modules/application/components/DesignSystem/ui/dialog';
import { Link } from '@tanstack/react-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { UserService } from '@/models/users/services/UserService';
import { EventService } from '@/models/events/services/EventService';
import { SchoolMessageService } from '@/models/schoolMessages/services/SchoolMessageService';
import { LeaderboardService } from '@/models/leaderboards/services/LeaderboardService';
import { toast } from 'sonner';
import ActivityLogPreview from './ActivityLogPreview';

interface SchoolAdminDashboardProps {
  user: UserInterface;
  viewingSchoolId?: string;
  viewingSchoolName?: string;
  viewingSchoolRegistrationMethod?: 'domain_blocklist' | 'allowlist';
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  messageCount: number;
  pendingEvents: number;
  schoolRank: number;
  totalMinutes: number;
}

const SchoolAdminDashboard = ({ user, viewingSchoolId, viewingSchoolName, viewingSchoolRegistrationMethod }: SchoolAdminDashboardProps) => {
  const schoolId = viewingSchoolId || user.school_id;
  const schoolName = viewingSchoolName || user.school?.name;
  const registrationMethod = viewingSchoolRegistrationMethod ?? user.school?.registration_method ?? 'domain_blocklist';
  const isAllowList = registrationMethod === 'allowlist';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const signUpUrl = typeof window !== 'undefined' ? `${window.location.origin}/schools/${schoolId}/signup` : '';

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

        const schoolEntry = leaderboard.find(entry => entry.id === schoolId);

        setStats({
          totalUsers: userStats.total,
          activeUsers: userStats.active,
          messageCount,
          pendingEvents: pendingCount,
          schoolRank: schoolEntry?.rank ?? 0,
          totalMinutes: userStats.totalMinutes,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [schoolId]);

  const handleCopySignUpUrl = async () => {
    const url = `${window.location.origin}/schools/${schoolId}/signup`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Sign up URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL to clipboard');
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
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setQrCopied(true);
        toast.success('QR code copied to clipboard!');
        setTimeout(() => setQrCopied(false), 2000);
      });
    } catch {
      toast.error('Failed to copy QR code to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const schoolParam = viewingSchoolId ? `?schoolId=${viewingSchoolId}` : '';
  const quickActions = [
    {
      title: 'Manage Houses',
      description: 'Add and edit house teams',
      href: `/admin/houses${schoolParam}`,
      icon: Crown,
      color: 'bg-purple-500',
      badge: 0,
    },
    {
      title: 'Manage Challenges',
      description: 'Review pending challenges',
      href: `/admin/challenges${schoolParam}`,
      icon: Clock,
      color: 'bg-orange-500',
      badge: stats.pendingEvents,
      needsAttention: stats.pendingEvents > 0,
      secondaryHref: '/challenges',
      secondaryLabel: 'View challenges',
    },
    {
      title: 'Activity Log',
      description: 'View and moderate activity logs',
      href: `/admin/activity${schoolParam}`,
      icon: Activity,
      color: 'bg-red-500',
      badge: 0,
      needsAttention: false,
    },
    {
      title: 'Assembly Mode',
      description: 'Present live updates to the school',
      href: `/admin/assembly${schoolParam}`,
      icon: Monitor,
      color: 'bg-[#0B4B39]',
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
            <Link href="/admin/schools" className="text-sm text-blue-600 hover:underline">
              ← Back to all schools
            </Link>
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900">School Admin Dashboard</h1>
        <p className="text-gray-600">
          Managing {schoolName}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.totalMinutes)} minutes</div>
            <p className="text-xs text-muted-foreground">
              All student activities
            </p>
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
              <p className="text-xs text-muted-foreground">
                Unread messages
              </p>
            </div>
            <Button asChild className="w-full mt-4" style={{ backgroundColor: '#0B4B39' }}>
              <Link href={`/admin/updates${schoolParam}`}>Manage messages</Link>
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
            <p className="text-xs text-muted-foreground">
              In district
            </p>
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
                          className={`flex items-center gap-1 ${action.needsAttention ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
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
                  <Button asChild className="w-full" style={{ backgroundColor: '#0B4B39' }}>
                    <Link href={action.href}>
                      Open {action.title}
                    </Link>
                  </Button>
                  {action.secondaryHref && (
                    <Button asChild variant="outline" className="w-full mt-2">
                      <Link href={action.secondaryHref}>
                        {action.secondaryLabel}
                      </Link>
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
                style={{ backgroundColor: '#0B4B39' }}
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
                style={{ backgroundColor: '#0B4B39' }}
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
                <p className="text-sm text-gray-500">Share this QR code with your students to help them register with Karawhiua</p>
              </DialogHeader>
              <div className="flex justify-center py-2">
                <canvas ref={canvasRef} className="rounded-lg" />
              </div>
              <Button
                onClick={handleCopyQrCode}
                className="w-full gap-2"
                style={{ backgroundColor: '#0B4B39' }}
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
      <ActivityLogPreview schoolId={schoolId} schoolParam={schoolParam} />

      {/* Registration method */}
      <Card className={isAllowList ? 'border-green-100' : 'border-red-100'}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg text-white ${isAllowList ? 'bg-green-600' : 'bg-red-500'}`}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <CardTitle>{isAllowList ? 'Allow List' : 'Block List'}</CardTitle>
              <p className="text-sm text-gray-600 mt-0.5">Control which students can register</p>
            </div>
          </div>
          <Button asChild style={{ backgroundColor: '#0B4B39' }}>
            <Link href={`/admin/allowlist${schoolParam}`}>{isAllowList ? 'Manage Allow List' : 'Manage Block List'}</Link>
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
};

export default SchoolAdminDashboard; 