import { useState, useCallback } from "react";
import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { m, AnimatePresence } from "framer-motion";
import { Image, Clock, CheckCircle2, XCircle, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { getActivityIcon, getActivityColor } from "@/modules/activities/utils/activityIcons";

interface StudentPhotoFeedProps {
  activities: ActivityInterface[];
  userId: string;
  onDelete?: () => void;
}

const statusConfig = {
  pending: { icon: Clock, label: "Pending", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  approved: { icon: CheckCircle2, label: "Approved", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  rejected: { icon: XCircle, label: "Rejected", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const StudentPhotoFeed = ({ activities, userId, onDelete }: StudentPhotoFeedProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const photosWithImages = activities.filter(
    (a) => a.proof_image_url && a.is_shared_to_feed,
  );

  const handleDelete = async (activityId: string, storagePath?: string | null) => {
    if (!confirm("Remove this photo from your feed and the school feed?")) return;
    setDeleting(activityId);
    try {
      const supabase = createSupabaseClient();

      // Clear the shared-to-feed flag and proof image
      const { error } = await supabase
        .from("activities")
        .update({
          is_shared_to_feed: false,
          proof_image_url: null,
          proof_image_storage_path: null,
        } as any)
        .eq("id", activityId)
        .eq("user_id", userId);

      if (error) throw error;

      // Delete the file from storage if path exists
      if (storagePath) {
        await supabase.storage.from("activity-proofs").remove([storagePath] as any);
      }

      toast.success("Photo removed");
      onDelete?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove photo");
    } finally {
      setDeleting(null);
    }
  };

  if (photosWithImages.length === 0) return null;

  return (
    <Card className="shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image size={18} className="text-[#D103D1]" />
            <span className="font-semibold text-gray-800 text-sm">Your Photos</span>
            <Badge className="text-xs bg-[#D103D1]/10 text-[#D103D1]">{photosWithImages.length}</Badge>
          </div>
          <p className="text-xs text-gray-400">Last 7 days</p>
        </div>

        <div className="divide-y divide-gray-100">
          <AnimatePresence>
            {photosWithImages.slice(0, 10).map((activity) => {
              const status = activity.feed_approved ? "approved" as const :
                (activity.is_shared_to_feed && activity.feed_approved === false) ? "rejected" as const :
                "pending" as const;
              const cfg = statusConfig[status];
              const StatusIcon = cfg.icon;
              const isExpanded = expanded === activity.id;
              const isDeleting = deleting === activity.id;

              return (
                <m.div key={activity.id} layout>
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : activity.id)}
                    className="w-full flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={activity.proof_image_url!}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {activity.custom_activity_name || (activity.activity_type || "").replace(/_/g, " ")}
                        </span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <StatusIcon size={10} className="mr-1" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {activity.duration_minutes} min · {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Arrow */}
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {/* Expanded preview */}
                  {isExpanded && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 sm:px-6 pb-4"
                    >
                      <div className="relative rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={activity.proof_image_url!}
                          alt="Activity proof"
                          className="w-full max-h-64 object-contain"
                        />
                        {/* Activity badge */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 text-white text-xs">
                          <span style={{ color: getActivityColor(activity.activity_type) }}>
                            {getActivityIcon(activity.activity_type, 14)}
                          </span>
                          {activity.activity_type.replace(/_/g, " ")}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(activity.id, activity.proof_image_storage_path)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Remove
                        </Button>
                      </div>
                    </m.div>
                  )}
                </m.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentPhotoFeed;
