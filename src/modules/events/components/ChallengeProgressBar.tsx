import { useState, useEffect } from "react";
import { EventService } from "@/models/events/services/EventService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { EventInterface, ChallengeProgress } from "@/models/events/interfaces/EventInterface";
import { Progress } from "@/modules/application/components/DesignSystem/ui/progress";
import { CheckCircle, Clock, Users } from "lucide-react";

interface ChallengeProgressBarProps {
  event: EventInterface;
  userId?: string;
  houseId?: string;
  schoolId?: string;
}

const eventService = new EventService(createSupabaseClient());

const ChallengeProgressBar = ({ event, userId, houseId, schoolId }: ChallengeProgressBarProps) => {
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        let result: ChallengeProgress | null = null;
        if (event.scope === "house" && houseId && schoolId) {
          result = await eventService.getHouseChallengeProgress(event.id, houseId, schoolId);
        } else if (userId) {
          result = await eventService.getUserChallengeProgress(event.id, userId);
        }
        if (mounted) setProgress(result);
      } catch {
        if (mounted) setProgress(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [event.id, userId, houseId, schoolId, event.scope]);

  if (loading) {
    return <div className="animate-pulse h-2 w-full rounded-full bg-gray-200" />;
  }

  if (!progress) {
    return (
      <div className="text-xs text-gray-400 flex items-center gap-1">
        <Clock size={12} />
        Not started
      </div>
    );
  }

  const pct =
    progress.target_value > 0
      ? Math.min(Math.round((progress.progress_value / progress.target_value) * 100), 100)
      : 0;

  const label =
    event.completion_type === "session_count"
      ? `${progress.progress_value}/${progress.target_value} sessions`
      : event.completion_type === "active_days"
        ? `${progress.progress_value}/${progress.target_value} days`
        : `${progress.progress_value}/${progress.target_value} min`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        {progress.completed ? (
          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
            <CheckCircle size={12} />
            Completed
          </span>
        ) : (
          <span className="text-xs text-gray-400">{pct}%</span>
        )}
      </div>
      <Progress
        value={pct}
        className="h-2"
        indicatorClassName={
          progress.completed ? "bg-green-500" : pct > 50 ? "bg-[#0B4B39]" : "bg-[#D103D1]"
        }
      />
      {event.scope === "house" && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Users size={10} />
          House collective
        </div>
      )}
    </div>
  );
};

export default ChallengeProgressBar;
