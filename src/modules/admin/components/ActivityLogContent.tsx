'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import useAdminData from '@/modules/common/hooks/useAdminData';
import Link from 'next/link';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { ActivityService } from '@/models/activities/services/ActivityService';
import { isSuperAdmin as checkIsSuperAdmin } from '@/modules/auth/utils/roleUtils';
import { ActivityInterface } from '@/models/activities/interfaces/ActivityInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Input } from '@/modules/application/components/DesignSystem/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';
import { rejectActivity, undoRejectActivity, rejectActivitiesBulk } from '@/modules/admin/actions/rejectActivity';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { NZ_TIMEZONE, getNZDate, computeGroupRejectableIds } from '@/modules/admin/utils/activityUtils';
import ActivityRow from '@/modules/admin/components/ActivityRow';

const PAGE_SIZE = 20;

interface ActivityLogContentProps {
  user: UserInterface;
  schools?: SchoolInterface[];
  initialSchoolId?: string | null;
}

const ActivityLogContent = ({ user, schools, initialSchoolId }: ActivityLogContentProps) => {
  const isSuperAdmin = checkIsSuperAdmin(user);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(
    isSuperAdmin ? (initialSchoolId ?? null) : user.school_id
  );
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  const activityService = useMemo(() => new ActivityService(createSupabaseClient()), []);

  const { data: allActivities, loading, refresh } = useAdminData({
    fetchFn: () => activityService.getActivitiesForSchool(selectedSchoolId, 500),
    fetchOnMount: false,
  });

  useEffect(() => {
    if (!isSuperAdmin && !selectedSchoolId) return;
    refresh();
    setPage(0);
  }, [selectedSchoolId, refresh]);

  const handleSchoolChange = (value: string) => {
    setPage(0);
    setShowFlaggedOnly(false);
    setClassFilter('');
    setSelectedSchoolId(value === 'all' ? null : value);
  };

  const handleReject = (activityId: string) => {
    startTransition(async () => {
      try {
        await rejectActivity(activityId);
        toast.success('Activity rejected');
        await refresh();
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
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to undo rejection');
      }
    });
  };

  const handleRejectAll = (activityIds: string[]) => {
    startTransition(async () => {
      try {
        await rejectActivitiesBulk(activityIds);
        toast.success(`${activityIds.length} ${activityIds.length === 1 ? 'activity' : 'activities'} rejected`);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to reject activities');
      }
    });
  };

  const groupRejectableIds = useMemo(() => computeGroupRejectableIds(allActivities), [allActivities]);

  const selectedSchoolName = selectedSchoolId
    ? schools?.find(s => s.id === selectedSchoolId)?.name ?? user.school?.name
    : null;

  const backHref = isSuperAdmin
    ? (selectedSchoolId ? `/admin/dashboard?schoolId=${selectedSchoolId}` : '/admin')
    : '/admin/dashboard';

  const subtitle = isSuperAdmin
    ? (selectedSchoolName ?? 'All Schools')
    : (user.school?.name ?? '');

  const filtered = useMemo(() => {
    let result = showFlaggedOnly ? allActivities.filter(a => a.is_flagged) : allActivities;
    if (classFilter) {
      const term = classFilter.toLowerCase();
      result = result.filter(a => a.user?.class?.toLowerCase().includes(term));
    }
    return result;
  }, [allActivities, showFlaggedOnly, classFilter]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const flaggedCount = allActivities.filter(a => a.is_flagged).length;

  // Groups for the flagged-only view
  const flaggedGroups = showFlaggedOnly
    ? paginated.reduce((acc, activity) => {
        const key = `${activity.user_id}|${getNZDate(activity.created_at)}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(activity);
        return acc;
      }, {} as Record<string, ActivityInterface[]>)
    : null;

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <div className="mb-3">
          <Link href={backHref} className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-600">
          {loading ? 'Loading…' : `All logged activities for ${subtitle}`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {isSuperAdmin && schools && schools.length > 0 && (
          <>
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">School</label>
            <Select value={selectedSchoolId ?? 'all'} onValueChange={handleSchoolChange}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools.map(school => (
                  <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        <Input
          placeholder="Filter by class..."
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setPage(0); }}
          className="w-44"
        />
        {classFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setClassFilter(''); setPage(0); }}>
            Clear class
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#00ACEF]" />
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {allActivities.length} total activities
            </Badge>
            {flaggedCount > 0 && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-3 py-1">
                <AlertTriangle size={14} className="mr-1" />
                {flaggedCount} flagged
              </Badge>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                variant={showFlaggedOnly ? 'outline' : 'default'}
                onClick={() => { setShowFlaggedOnly(false); setPage(0); }}
                style={!showFlaggedOnly ? { backgroundColor: '#0B4B39', color: 'white' } : undefined}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={showFlaggedOnly ? 'default' : 'outline'}
                onClick={() => { setShowFlaggedOnly(true); setPage(0); }}
                className={showFlaggedOnly ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}
              >
                <AlertTriangle size={14} className="mr-1" />
                Flagged only
              </Button>
            </div>
          </div>

          {/* Activity list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {showFlaggedOnly ? 'Flagged Activities' : 'All Activities'}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filtered.length} {filtered.length === 1 ? 'entry' : 'entries'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paginated.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  {showFlaggedOnly ? 'No flagged activities found.' : 'No activities logged yet.'}
                </p>
              ) : showFlaggedOnly && flaggedGroups ? (
                // Grouped view for flagged-only: group headers + Reject All per group
                <div className="space-y-4">
                  {Object.entries(flaggedGroups).map(([groupKey, groupActivities]) => {
                    const rep = groupActivities[0];
                    const userName = rep.user
                      ? `${rep.user.first_name} ${rep.user.last_name}`
                      : 'Unknown';
                    const dateLabel = format(
                      toZonedTime(new Date(rep.created_at), NZ_TIMEZONE),
                      'MMM d, yyyy'
                    );
                    const totalMin = groupActivities.reduce((s, a) => s + (a.duration_minutes || 0), 0);
                    const rejectableIds = groupActivities.filter(a => !a.is_rejected).map(a => a.id);

                    return (
                      <div key={groupKey} className="rounded-lg border border-amber-200 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                            <AlertTriangle size={14} className="text-amber-600" />
                            <span>{userName}</span>
                            <span className="text-amber-600">—</span>
                            <span>{dateLabel}</span>
                            <span className="text-amber-600">—</span>
                            <span>{totalMin} min total</span>
                          </div>
                          {rejectableIds.length > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isPending}
                              onClick={() => handleRejectAll(rejectableIds)}
                              className="flex-shrink-0"
                            >
                              <X size={14} className="mr-1" />
                              Reject All ({rejectableIds.length})
                            </Button>
                          )}
                        </div>
                        <div className="divide-y divide-gray-100">
                          {groupActivities.map(activity => (
                            <ActivityRow
                              key={activity.id}
                              activity={activity}
                              isSuperAdmin={isSuperAdmin}
                              selectedSchoolId={selectedSchoolId}
                              schools={schools}
                              isPending={isPending}
                              showInlineReject={false}
                              onReject={handleReject}
                              onUndoReject={handleUndoReject}
                              onRejectGroup={handleRejectAll}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Flat view for All Activities: inline Reject + Reject Group on flagged rows
                <div className="space-y-2">
                  {paginated.map(activity => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      isSuperAdmin={isSuperAdmin}
                      selectedSchoolId={selectedSchoolId}
                      schools={schools}
                      isPending={isPending}
                      showInlineReject={true}
                      groupRejectableIds={groupRejectableIds.get(activity.id)}
                      onReject={handleReject}
                      onUndoReject={handleUndoReject}
                      onRejectGroup={handleRejectAll}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ActivityLogContent;
