import { useEffect, useState, useTransition, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { ActivityService } from '@/models/activities/services/ActivityService';
import { ActivityInterface } from '@/models/activities/interfaces/ActivityInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { rejectActivity, undoRejectActivity, rejectActivitiesBulk } from '@/modules/admin/actions/rejectActivity';
import { toast } from 'sonner';
import { computeGroupRejectableIds } from '@/modules/admin/utils/activityUtils';
import ActivityRow from '@/modules/admin/components/ActivityRow';

const PREVIEW_COUNT = 5;

interface ActivityLogPreviewProps {
  schoolId: string;
  schoolParam: string;
}

const ActivityLogPreview = ({ schoolId, schoolParam }: ActivityLogPreviewProps) => {
  const [allFetched, setAllFetched] = useState<ActivityInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchActivities = async () => {
    try {
      const supabase = createSupabaseClient();
      const activityService = new ActivityService(supabase);
      const data = await activityService.getActivitiesForSchool(schoolId, 30);
      setAllFetched(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!schoolId) return;
    fetchActivities();
  }, [schoolId]);

  const groupRejectableIds = useMemo(() => computeGroupRejectableIds(allFetched), [allFetched]);

  const activities = allFetched.slice(0, PREVIEW_COUNT);

  const handleReject = (activityId: string) => {
    startTransition(async () => {
      try {
        await rejectActivity(activityId);
        toast.success('Activity rejected');
        setLoading(true);
        await fetchActivities();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to reject activity');
      }
    });
  };

  const handleUndoReject = (activityId: string) => {
    startTransition(async () => {
      try {
        await undoRejectActivity(activityId);
        toast.success('Rejection undone');
        setLoading(true);
        await fetchActivities();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to undo rejection');
      }
    });
  };

  const handleRejectGroup = (activityIds: string[]) => {
    startTransition(async () => {
      try {
        await rejectActivitiesBulk(activityIds);
        toast.success(`${activityIds.length} ${activityIds.length === 1 ? 'activity' : 'activities'} rejected`);
        setLoading(true);
        await fetchActivities();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to reject group');
      }
    });
  };

  const flaggedCount = activities.filter(a => a.is_flagged).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            Recent Activity
            {flaggedCount > 0 && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                <AlertTriangle size={12} className="mr-1" />
                {flaggedCount} flagged
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-0.5">Overview of recent school activity</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/activity${schoolParam}`}>See all activity →</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No activities logged yet.</p>
        ) : (
          <div className="space-y-2">
            {activities.map(activity => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                isPending={isPending}
                showInlineReject={true}
                groupRejectableIds={groupRejectableIds.get(activity.id)}
                onReject={handleReject}
                onUndoReject={handleUndoReject}
                onRejectGroup={handleRejectGroup}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogPreview;
