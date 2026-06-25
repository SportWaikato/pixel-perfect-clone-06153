'use client';

import { AlertTriangle, MoreHorizontal, RotateCcw, X } from 'lucide-react';
import { ActivityInterface } from '@/models/activities/interfaces/ActivityInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/application/components/DesignSystem/ui/dropdown-menu';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { NZ_TIMEZONE, getUserInitials, getActivityDisplayName } from '@/modules/admin/utils/activityUtils';

export interface ActivityRowProps {
  activity: ActivityInterface;
  isSuperAdmin?: boolean;
  selectedSchoolId?: string | null;
  schools?: SchoolInterface[];
  isPending: boolean;
  showInlineReject: boolean;
  groupRejectableIds?: string[];
  onReject: (id: string) => void;
  onUndoReject: (id: string) => void;
  onRejectGroup: (ids: string[]) => void;
}

const ActivityRow = ({
  activity,
  isSuperAdmin,
  selectedSchoolId,
  schools,
  isPending,
  showInlineReject,
  groupRejectableIds,
  onReject,
  onUndoReject,
  onRejectGroup,
}: ActivityRowProps) => {
  const showRejectBtn = showInlineReject && activity.is_flagged && !activity.is_rejected;
  const showRejectGroupBtn = showRejectBtn && groupRejectableIds && groupRejectableIds.length > 1;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        activity.is_rejected
          ? 'bg-gray-50 border-gray-200 opacity-60'
          : activity.is_flagged
          ? 'bg-amber-50 border-amber-300 border-l-4 border-l-amber-500'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0">
          {getUserInitials(activity)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">
              {activity.user?.first_name} {activity.user?.last_name}
            </span>
            {isSuperAdmin && !selectedSchoolId && activity.user && (
              <span className="text-xs text-gray-400">
                {(activity.user as { school_id?: string }).school_id
                  ? (schools?.find(s => s.id === (activity.user as { school_id?: string }).school_id)?.name ?? '')
                  : ''}
              </span>
            )}
            {activity.is_flagged && (
              <span className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                <AlertTriangle size={11} />
                540 min/day
              </span>
            )}
            {activity.is_rejected && (
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                Rejected
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {getActivityDisplayName(activity)} • {activity.duration_minutes} min •{' '}
            {activity.final_points || activity.house_points_awarded} pts •{' '}
            {format(toZonedTime(new Date(activity.created_at), NZ_TIMEZONE), 'MMM d, yyyy h:mm a')}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        {showRejectBtn && (
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => onReject(activity.id)}
          >
            <X size={14} className="mr-1" />
            Reject
          </Button>
        )}
        {showRejectGroupBtn && (
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => onRejectGroup(groupRejectableIds!)}
            className="bg-red-700 hover:bg-red-800"
          >
            <X size={14} className="mr-1" />
            Reject Group ({groupRejectableIds!.length})
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" disabled={isPending} className="h-8 w-8 p-0">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {activity.is_rejected ? (
              <DropdownMenuItem
                onClick={() => onUndoReject(activity.id)}
                className="text-green-700 focus:text-green-700"
              >
                <RotateCcw size={14} className="mr-2" />
                Undo Rejection
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onReject(activity.id)}
                className="text-red-600 focus:text-red-600"
              >
                <X size={14} className="mr-2" />
                Reject Activity
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ActivityRow;
