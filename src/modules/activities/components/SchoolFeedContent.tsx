import { useState, useEffect, useCallback } from "react";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Heart, Clock, User2 } from "lucide-react";
import { toast } from "sonner";

interface SchoolFeedContentProps {
  schoolId: string;
  userId: string;
}

const activityService = new ActivityService(createSupabaseClient());

const SchoolFeedContent = ({ schoolId, userId }: SchoolFeedContentProps) => {
  const [activities, setActivities] = useState<ActivityInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await activityService.getFeedActivities(schoolId, 50);
      setActivities(data);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleLike = async (activityId: string) => {
    setLikingId(activityId);
    try {
      await activityService.likeFeedPost(activityId);
      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, feed_likes: (a.feed_likes || 0) + 1 } : a)),
      );
    } catch {
      toast.error("Couldn't like this post");
    } finally {
      setLikingId(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "yesterday";
    return d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
            <div className="w-full h-48 bg-gray-200 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">School Feed</h1>
        <p className="text-gray-600 mt-1">
          See what your school is up to. Share your proof photos to the feed when you log activity.
        </p>
      </div>

      {activities.length === 0 ? (
        <Card className="shadow-sm rounded-2xl border border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mb-4" />
            <p className="font-medium text-gray-700">No feed posts yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Share your first activity photo with proof to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        activities.map((activity) => {
          const user = (activity.user as unknown as Record<string, unknown>) || {};
          const house = (user.house as Record<string, unknown>) || {};

          return (
            <Card
              key={activity.id}
              className="shadow-sm rounded-2xl border border-gray-200 overflow-hidden"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: (house.color as string) || "#0B4B39" }}
                    >
                      <User2 size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {(user.first_name as string) || "Student"}{" "}
                        {(user.last_name as string) || ""}
                      </p>
                      <p className="text-xs text-gray-400">
                        {house.name as string} · {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    +{activity.final_points || activity.house_points_awarded} pts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {activity.proof_image_url && (
                  <div className="relative rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={activity.proof_image_url}
                      alt="Activity proof"
                      className="w-full max-h-96 object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {activity.duration_minutes} min · {activity.activity_type.replace(/_/g, " ")}
                  </div>
                  <button
                    onClick={() => handleLike(activity.id)}
                    disabled={likingId === activity.id}
                    className="flex items-center gap-1.5 text-sm transition-colors hover:scale-110 active:scale-95"
                    style={{ color: "#D103D1" }}
                  >
                    <Heart size={16} fill={(activity.feed_likes || 0) > 0 ? "#D103D1" : "none"} />
                    <span className="font-medium">{activity.feed_likes || 0}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default SchoolFeedContent;
