import { UserInterface } from "@/models/users/interfaces/UserInterface";
import {
  ActivityInterface,
  ACTIVITY_TYPES,
} from "@/models/activities/interfaces/ActivityInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import {
  getActivityIcon,
  getActivityColor,
  getFeelingEmoji,
} from "@/modules/activities/utils/activityIcons";
import { formatDistanceToNow } from "date-fns";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";

const NZ_TIMEZONE = "Pacific/Auckland";

interface ActivityHistoryProps {
  activities: ActivityInterface[];
  loading: boolean;
  onEditActivity?: (activity: ActivityInterface) => void;
  onDeleteActivity?: (activity: ActivityInterface) => void;
}

const ActivityHistory = ({
  activities,
  loading,
  onEditActivity,
  onDeleteActivity,
}: ActivityHistoryProps) => {
  const getActivityDisplayName = (activity: ActivityInterface) => {
    if (activity.activity_type === "something_else" && activity.custom_activity_name) {
      return activity.custom_activity_name;
    }

    return (
      ACTIVITY_TYPES[activity.activity_type as keyof typeof ACTIVITY_TYPES] ??
      activity.activity_type.replace("_", " ")
    );
  };

  if (loading) {
    return (
      <Card className="shadow-sm rounded-2xl border border-gray-100">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading activities...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm rounded-2xl border border-gray-100">
      <CardHeader>
        <CardTitle className="text-gray-800">Your Activity History</CardTitle>
        <p className="text-gray-500 text-sm">View all your logged activities</p>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No activities logged yet. Start logging your activities to see them here!
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const color = activity.is_rejected
                ? "#999"
                : getActivityColor(activity.activity_type);
              return (
                <div
                  key={activity.id}
                  className={`flex items-center gap-3 p-4 border rounded-2xl transition-colors ${
                    activity.is_rejected
                      ? "border-red-200 bg-red-50/60 opacity-75 cursor-default"
                      : "border-gray-100 bg-white shadow-sm hover:border-gray-200 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!activity.is_rejected) onEditActivity?.(activity);
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {getActivityIcon(activity.activity_type, 18)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        {getActivityDisplayName(activity)}
                      </span>
                      {activity.is_rejected && (
                        <Badge className="bg-red-100 text-red-700 text-xs border-0">Rejected</Badge>
                      )}
                      {activity.participation_type === "with_others" && !activity.is_rejected && (
                        <Badge className="bg-gray-100 text-gray-600 text-xs border-0">
                          With others
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {activity.duration_minutes} min · {getFeelingEmoji(activity.feeling)} ·{" "}
                      {formatTz(
                        toZonedTime(new Date(activity.created_at), NZ_TIMEZONE),
                        "MMM d, yyyy",
                        { timeZone: NZ_TIMEZONE },
                      )}
                    </div>
                    {activity.is_rejected && (
                      <div className="text-xs text-red-500 mt-0.5">Points removed by admin.</div>
                    )}
                    {activity.description && !activity.is_rejected && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {activity.description}
                      </div>
                    )}
                  </div>

                  {/* Points + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {activity.is_rejected ? (
                      <div className="text-sm font-bold text-red-400 line-through">
                        {activity.final_points || activity.house_points_awarded} pts
                      </div>
                    ) : (
                      <div className="text-sm font-bold" style={{ color: "#19AA4B" }}>
                        +{activity.final_points || activity.house_points_awarded} pts
                        {activity.challenge_points_multiplier &&
                          activity.challenge_points_multiplier > 1 && (
                            <span className="ml-1 text-xs bg-yellow-500 text-black px-1 rounded">
                              {activity.challenge_points_multiplier}×
                            </span>
                          )}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </div>
                    {!activity.is_rejected && (
                      <div className="flex items-center gap-1">
                        {onEditActivity && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditActivity(activity);
                            }}
                            variant="ghost"
                            className="p-1.5 h-auto text-gray-400 hover:text-[#1B5E4B] hover:bg-[#1B5E4B]/10 rounded-lg"
                            title="Edit activity"
                          >
                            <Edit2 size={14} />
                          </Button>
                        )}
                        {onDeleteActivity && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteActivity(activity);
                            }}
                            variant="ghost"
                            className="p-1.5 h-auto text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            title="Delete activity"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityHistory;
