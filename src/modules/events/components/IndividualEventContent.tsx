import { useState, useEffect, useMemo } from "react";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Progress } from "@/modules/application/components/DesignSystem/ui/progress";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { EventService } from "@/models/events/services/EventService";
import { ActivityService } from "@/models/activities/services/ActivityService";
import {
  ArrowLeft,
  Calendar,
  Users,
  Trophy,
  Target,
  Activity,
  Award,
  Zap,
  Share2,
  ImageDown,
} from "lucide-react";
import { format } from "date-fns";
import { formatEventDate } from "@/modules/common/utils/dateUtils";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import YouTubeVideoEmbed from "./YouTubeVideoEmbed";
import { getActivityIcon, getActivityColor } from "@/modules/activities/utils/activityIcons";
import { ACTIVITY_TYPES } from "@/models/activities/interfaces/ActivityInterface";

interface IndividualEventContentProps {
  user: UserInterface;
  eventId: string;
}

const IndividualEventContent = ({ user, eventId }: IndividualEventContentProps) => {
  const [event, setEvent] = useState<EventInterface | null>(null);
  const [userActivities, setUserActivities] = useState<ActivityInterface[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const [userProgress, setUserProgress] = useState({ totalMinutes: 0, totalPoints: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const router = useRouter();
  const navigate = useNavigate();

  const eventService = useMemo(() => new EventService(createSupabaseClient()), []);
  const activityService = useMemo(() => new ActivityService(createSupabaseClient()), []);

  useEffect(() => {
    loadEventData();
  }, [eventId, user.id]);

  const loadEventData = async () => {
    try {
      setLoading(true);

      const [eventData, participation, activities] = await Promise.all([
        eventService.getEventWithBadge(eventId),
        eventService.getUserEventParticipation(user.id),
        activityService
          .getActivitiesByEventId(eventId, user.id)
          .catch(() => [] as ActivityInterface[]),
      ]);

      if (!eventData) {
        toast.error("Event not found");
        navigate({ to: "/challenges" });
        return;
      }

      setEvent(eventData);
      setIsParticipating(participation.includes(eventId));
      setUserActivities(activities);

      const totalMinutes = activities.reduce(
        (sum, activity) => sum + (activity.duration_minutes || 0),
        0,
      );
      const totalPoints = activities.reduce(
        (sum, activity) => sum + (activity.final_points || 0),
        0,
      );
      setUserProgress({ totalMinutes, totalPoints });
    } catch (error) {
      notifyAboutError(error);
      navigate({ to: "/challenges" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    try {
      setActionLoading(true);
      await eventService.joinEvent(eventId, user.id);
      setIsParticipating(true);
      toast.success("Successfully joined the challenge!");
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    try {
      setActionLoading(true);
      await eventService.leaveEvent(eventId, user.id);
      setIsParticipating(false);
      toast.success("You have left the challenge.");
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateImage = async () => {
    if (!event) return;
    setImageGenerating(true);
    try {
      // Strip HTML tags and truncate description before adding to URL
      const plainDescription = (event.description || "").replace(/<[^>]*>/g, "");

      const params = new URLSearchParams({
        name: event.name,
        type: event.event_type,
        dates: `${formatEventDate(event.start_date, "MMM d")} - ${formatEventDate(event.end_date, "MMM d")}`,
        participants: String(event.participant_count),
        description: plainDescription,
      });
      if (event.challenge_points) params.set("points", String(event.challenge_points));
      if (event.points_multiplier && event.points_multiplier > 1)
        params.set("multiplier", String(event.points_multiplier));
      if (event.event_image_url) params.set("imageUrl", event.event_image_url);
      if (event.target_minutes)
        params.set("targetHours", String(Math.round(event.target_minutes / 60)));

      const url = `/api/challenges/share-image?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(`Image generation failed: ${text}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${event.name.replace(/\s+/g, "-")}-challenge.png`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setImageGenerating(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareText = event
      ? `Check out this challenge: ${event.name}`
      : "Check out this challenge on Karawhiua!";

    if (navigator.share) {
      try {
        await navigator.share({ title: event?.name, text: shareText, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleLogActivity = async () => {
    if (!isParticipating) {
      try {
        setActionLoading(true);
        await eventService.joinEvent(eventId, user.id);
        setIsParticipating(true);
      } catch (error) {
        notifyAboutError(error);
        setActionLoading(false);
        return;
      }
      setActionLoading(false);
    }
    navigate({ to: `/activities?challenge=${eventId}` });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const progressPercentage = event.target_minutes
    ? Math.min((userProgress.totalMinutes / event.target_minutes) * 100, 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/challenges" })}
        className="gap-2 -ml-2 text-gray-600"
      >
        <ArrowLeft size={16} />
        Back to Challenges
      </Button>

      {/* Main Challenge Card */}
      <Card
        className="shadow-sm rounded-2xl border border-gray-200"
        style={{ backgroundColor: "#f9fefd" }}
      >
        <CardContent className="p-6 sm:p-8">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="capitalize bg-[#1B5E4B]/10 text-[#1B5E4B] border-[#1B5E4B]/20"
              >
                {event.event_type}
              </Badge>
              {event.is_student_suggested && (
                <Badge className="bg-purple-500 text-white text-xs">Student Suggested</Badge>
              )}
            </div>
            {event.challenge_points ? (
              <Badge className="bg-orange-500 text-white text-sm px-3">
                <Zap size={12} className="mr-1" />
                {event.challenge_points} pts
              </Badge>
            ) : event.points_multiplier && event.points_multiplier > 1 ? (
              <Badge className="bg-orange-500 text-white text-sm px-3">
                <Zap size={12} className="mr-1" />
                {event.points_multiplier}× pts
              </Badge>
            ) : null}
          </div>

          <h1 className="text-3xl font-black text-[#1B5E4B] mb-2">{event.name}</h1>
          <div className="flex items-center gap-4 text-gray-500 text-sm mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatEventDate(event.start_date, "MMM d")} –{" "}
              {formatEventDate(event.end_date, "MMM d")}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {event.participant_count} joined
            </span>
            {event.target_minutes && (
              <span className="flex items-center gap-1.5">
                <Target size={14} />
                {Math.round(event.target_minutes / 60)}h target
              </span>
            )}
          </div>

          {/* Challenge image */}
          {event.event_image_url && (
            <div className="mb-6">
              <img src={event.event_image_url} alt={event.name} className="w-full rounded-xl" />
            </div>
          )}

          <p className="text-gray-700 leading-relaxed mb-6">{event.description}</p>

          {/* Video */}
          {event.youtube_video_url && (
            <div className="mb-6">
              <YouTubeVideoEmbed
                url={event.youtube_video_url}
                title={event.name}
                className="rounded-xl"
              />
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleLogActivity}
              disabled={actionLoading}
              className="gap-2 font-bold"
              style={{ backgroundColor: "#D103D1", color: "white" }}
            >
              <Activity size={16} />
              Log Activity
            </Button>
            {!isParticipating ? (
              <Button
                onClick={handleJoinEvent}
                disabled={actionLoading}
                className="gap-2 font-bold"
                style={{ backgroundColor: "#1B5E4B", color: "white" }}
              >
                <Users size={16} />
                Join Challenge
              </Button>
            ) : (
              <Button
                onClick={handleLeaveEvent}
                disabled={actionLoading}
                variant="outline"
                className="gap-2 font-bold text-red-600 border-red-200 hover:bg-red-50"
              >
                Leave Challenge
              </Button>
            )}
            <Button
              onClick={handleCreateImage}
              disabled={imageGenerating}
              variant="outline"
              className="gap-2 font-bold text-gray-600"
            >
              <ImageDown size={16} />
              {imageGenerating ? "Creating…" : "Create image"}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="gap-2 font-bold text-gray-600"
            >
              <Share2 size={16} />
              Share link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Badge */}
      {event.badge && (
        <Card className="shadow-sm rounded-2xl border border-gray-100">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="relative w-20 h-20 shrink-0">
              <img
                src={`/badges/${event.badge.image_filename}`}
                alt={event.badge.name}
                className="absolute inset-0 w-full h-full object-cover object-contain drop-shadow"
              />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#1B5E4B] uppercase mb-0.5">
                Challenge Badge
              </p>
              <p className="font-bold text-gray-800">{event.badge.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{event.badge.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Progress */}
      {isParticipating && (
        <Card className="shadow-sm rounded-2xl border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Target size={18} />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-[#1B5E4B]/5 rounded-xl">
                <p className="text-2xl font-black text-[#1B5E4B]">{userProgress.totalMinutes}</p>
                <p className="text-xs text-gray-500">mins logged</p>
              </div>
              <div className="text-center p-3 bg-[#1B5E4B]/5 rounded-xl">
                <p className="text-2xl font-black text-[#1B5E4B]">{userActivities.length}</p>
                <p className="text-xs text-gray-500">activities</p>
              </div>
              <div className="text-center p-3 bg-[#1B5E4B]/5 rounded-xl">
                <p className="text-2xl font-black" style={{ color: "#19AA4B" }}>
                  {userProgress.totalPoints}
                </p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>

            {event.target_minutes && (
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">
                    {userProgress.totalMinutes} of {event.target_minutes} mins
                  </span>
                  <span className="font-semibold text-[#1B5E4B]">
                    {Math.round(progressPercentage)}% complete
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2.5" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      {isParticipating && userActivities.length > 0 && (
        <Card className="shadow-sm rounded-2xl border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-800">Your Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userActivities.slice(0, 5).map((activity) => {
                const color = getActivityColor(activity.activity_type);
                const displayName =
                  activity.activity_type === "something_else" && activity.custom_activity_name
                    ? activity.custom_activity_name
                    : (ACTIVITY_TYPES[activity.activity_type as keyof typeof ACTIVITY_TYPES] ??
                      activity.activity_type.replace(/_/g, " "));
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {getActivityIcon(activity.activity_type, 18)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500">
                        {activity.duration_minutes || 0} min ·{" "}
                        {format(new Date(activity.created_at), "MMM d")}
                      </p>
                    </div>
                    <div className="text-sm font-bold shrink-0" style={{ color: "#19AA4B" }}>
                      +{activity.final_points} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndividualEventContent;
