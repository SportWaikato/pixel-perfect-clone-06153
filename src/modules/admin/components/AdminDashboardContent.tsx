import * as React from 'react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { ActivityInterface } from '@/models/activities/interfaces/ActivityInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { EventInterface } from '@/models/events/interfaces/EventInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import ActivityExportDialog from './ActivityExportDialog';

const SchoolPerformanceChart = React.lazy(() => import('./SchoolPerformanceChart'));
import SuperAdminMessagesSection from './SuperAdminMessagesSection';
import {
  Users,
  School,
  Activity,
  TrendingUp,
  AlertCircle,
  Download,
  ShieldAlert
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getActivityIcon, getActivityColor } from '@/modules/activities/utils/activityIcons';

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
}

const AdminDashboardContent = ({
  user,
  platformStats,
  recentActivities,
  schools,
  events
}: AdminDashboardContentProps) => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview, analytics, and management tools</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          Super Admin
        </Badge>
      </div>

      {/* Platform Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">
              Active participating schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{platformStats.newSignupsThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalActivities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Logged by all students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalHours.toLocaleString()} hrs</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(platformStats.totalHours / 24).toLocaleString()} days of activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Activity Type</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {platformStats.topActivityType.replace(/_/g, ' ')}
            </div>
            <p className="text-xs text-muted-foreground">
              {platformStats.topActivityCount.toLocaleString()} activities
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Performance Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top 10 Schools by Pro-rata Score
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ranked by average points per student × 100 for fair comparison
              </p>
            </CardHeader>
            <CardContent>
              <SchoolPerformanceChart schools={schools} />
            </CardContent>
          </Card>
        </div>

        {/* Growth Metrics and System Status */}
        <div className="space-y-6">
          {/* Growth Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Growth Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Challenges</span>
                <Badge variant="secondary">{platformStats.activeEvents}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Signups (7d)</span>
                <Badge variant="secondary" className="text-green-600">
                  +{platformStats.newSignupsThisWeek}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Time/Student</span>
                <Badge variant="secondary">
                  {platformStats.totalUsers > 0
                    ? Math.round(platformStats.totalMinutes / platformStats.totalUsers)
                    : '0'
                  } min
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Platform Health</span>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Sync</span>
                <Badge className="bg-green-100 text-green-800">Up to date</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Challenges</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {events.filter(e => e.is_active).length} Running
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent activities found
              </p>
            ) : (
              recentActivities.slice(0, 15).map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
                    style={{ backgroundColor: getActivityColor(activity.activity_type) }}
                  >
                    {getActivityIcon(activity.activity_type, 18)}
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
                      {activity.activity_type.replace('_', ' ')}
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

      {/* Allow Lists */}
      <Card className="border-green-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-600 text-white">
              <ShieldAlert size={18} />
            </div>
            <div>
              <CardTitle>Allow Lists</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Manage permitted student emails per school</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/allowlist">Manage Allow Lists</Link>
          </Button>
        </CardHeader>
      </Card>

      {/* Export Dialog */}
      <ActivityExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
};

export default AdminDashboardContent; 
