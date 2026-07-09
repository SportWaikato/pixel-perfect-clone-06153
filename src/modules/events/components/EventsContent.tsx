import { m } from "framer-motion";
import { useState, useMemo } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Input } from "@/modules/application/components/DesignSystem/ui/input";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { EventService } from "@/models/events/services/EventService";
import { ActivityService } from "@/models/activities/services/ActivityService";
import {
  Search,
  Users,
  Plus,
  Target,
  Clock,
  ChevronRight,
  GraduationCap,
  CalendarClock,
} from "lucide-react";
import { formatEventDate } from "@/modules/common/utils/dateUtils";
import CreateEventDialog from "@/modules/admin/components/CreateEventDialog";
import {
  getActivityIcon,
  getActivityColor,
  resolveEventIconType,
} from "@/modules/activities/utils/activityIcons";
import { Link } from "@tanstack/react-router";
interface EventsContentProps {
  user: UserInterface;
  initialEvents: EventInterface[];
  initialParticipation: string[];
  initialEventProgress: Record<string, number>;
}

const EventsContent = ({
  user,
  initialEvents,
  initialParticipation,
  initialEventProgress,
}: EventsContentProps) => {
  const [events, setEvents] = useState<EventInterface[]>(initialEvents);
  const [userParticipation, setUserParticipation] = useState<string[]>(initialParticipation);
  const [eventProgress, setEventProgress] = useState<Record<string, number>>(initialEventProgress);
  const [searchTerm, setSearchTerm] = useState("");
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const supabaseClient = useMemo(() => createSupabaseClient(), []);
  const eventService = useMemo(() => new EventService(supabaseClient), [supabaseClient]);
  const activityService = useMemo(() => new ActivityService(supabaseClient), [supabaseClient]);

  const fetchEvents = async () => {
    try {
      const [approvedEvents, participation, progress] = await Promise.all([
        eventService.getApprovedEvents({
          viewerRole: user.role,
          viewerSchoolId: user.school_id,
        }),
        eventService.getUserEventParticipation(user.id),
        activityService.getActivityMinutesByEvent(user.id),
      ]);
      setEvents(approvedEvents);
      setUserParticipation(participation);
      setEventProgress(progress);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const today = useMemo(
    () => new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(new Date()),
    [],
  );

  const joinedEventCount = useMemo(
    () => events.filter((e) => userParticipation.includes(e.id)).length,
    [events, userParticipation],
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (showJoinedOnly && !userParticipation.includes(event.id)) return false;
        return event.name.toLowerCase().includes(searchTerm.toLowerCase());
      }),
    [events, searchTerm, showJoinedOnly, userParticipation],
  );

  const currentEvents = useMemo(
    () => filteredEvents.filter((e) => e.start_date <= today && e.end_date >= today),
    [filteredEvents, today],
  );

  const comingSoonEvents = useMemo(
    () => filteredEvents.filter((e) => e.start_date > today),
    [filteredEvents, today],
  );

  const getPointsLabel = (event: EventInterface): string | null => {
    if (event.challenge_points) return `${event.challenge_points} pts`;
    if (event.points_multiplier && event.points_multiplier > 1)
      return `${event.points_multiplier} × pts`;
    if (event.points_multiplier === 1) return `1 × pts`;
    return null;
  };

  return (
    <div className="px-4 py-6 sm:p-8 min-h-screen" style={{ backgroundColor: "#f5faf8" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#0F806118", color: "#0F8061" }}
            >
              <Target size={22} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1B5E4B]">Challenges</h1>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="gap-2 font-bold shrink-0"
            style={{ backgroundColor: "#1B5E4B", color: "white" }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Suggest a challenge</span>
            <span className="sm:hidden">Suggest</span>
          </Button>
        </div>
        <p className="text-sm sm:text-base" style={{ color: "#357665" }}>
          Join virtual sporting challenges and compete with students from other schools
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input
          placeholder="Search challenges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-gray-200"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        <Button
          size="sm"
          variant={!showJoinedOnly ? "default" : "outline"}
          onClick={() => setShowJoinedOnly(false)}
          className="font-semibold"
          style={!showJoinedOnly ? { backgroundColor: "#1B5E4B", color: "white" } : {}}
        >
          All Challenges
        </Button>
        <Button
          size="sm"
          variant={showJoinedOnly ? "default" : "outline"}
          onClick={() => setShowJoinedOnly(true)}
          className="font-semibold gap-2"
          style={showJoinedOnly ? { backgroundColor: "#1B5E4B", color: "white" } : {}}
        >
          Joined Challenges
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
            style={
              showJoinedOnly
                ? { backgroundColor: "rgba(255,255,255,0.25)", color: "white" }
                : { backgroundColor: "#1B5E4B", color: "white" }
            }
          >
            {joinedEventCount}
          </span>
        </Button>
      </div>

      {/* Current Challenges */}
      {currentEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "#1B5E4B" }}>
            Current Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentEvents.map((event, cardIndex) => {
              const iconType = resolveEventIconType(event);
              const color = getActivityColor(iconType);
              const pointsLabel = getPointsLabel(event);
              const targetHours = event.target_minutes
                ? Math.round(event.target_minutes / 60)
                : null;
              const participating = userParticipation.includes(event.id);
              const userMinutes = eventProgress[event.id] || 0;
              const progressPct =
                participating && event.target_minutes
                  ? Math.min(Math.round((userMinutes / event.target_minutes) * 100), 100)
                  : null;

              return (
                <Link key={event.id} to="/challenges/$id" params={{ id: event.id }}>
                  <m.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(cardIndex * 0.05, 0.4), duration: 0.25 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex items-start gap-3 cursor-pointer"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {getActivityIcon(iconType, 30)}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#1B5E4B] leading-snug truncate">
                            {event.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#62988a" }}>
                            {formatEventDate(event.start_date, "d MMM")} –{" "}
                            {formatEventDate(event.end_date, "d MMM")}
                          </p>
                        </div>
                        <ChevronRight size={32} className="shrink-0" style={{ color: "#548f7f" }} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="capitalize text-xs px-2 py-0 h-5 border-0"
                            style={{ backgroundColor: "#f0f5f4", color: "#3e7c6c" }}
                          >
                            {event.event_type}
                          </Badge>
                          {event.is_student_suggested && (
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                            >
                              <GraduationCap size={10} />
                              Student Suggested
                            </span>
                          )}
                          <span
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#f0f5f4", color: "#3e7c6c" }}
                          >
                            <Users size={11} />
                            {event.participant_count}
                          </span>
                          {targetHours && (
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#f0f5f4", color: "#3e7c6c" }}
                            >
                              <Clock size={11} />
                              {targetHours} {targetHours === 1 ? "hour" : "hours"}
                            </span>
                          )}
                          {participating && progressPct !== null && (
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#e6f5f0", color: "#0F8061" }}
                            >
                              {progressPct}% complete
                            </span>
                          )}
                          {participating && progressPct === null && (
                            <span className="text-xs font-medium text-[#0F8061]">Joined</span>
                          )}
                        </div>
                        {pointsLabel && (
                          <span
                            className="text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: "#FEE9E8", color: "#EF4250" }}
                          >
                            {pointsLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </m.div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Coming Soon Challenges */}
      {comingSoonEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "#1B5E4B" }}>
            Challenges Coming Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {comingSoonEvents.map((event, cardIndex) => {
              const iconType = resolveEventIconType(event);
              const color = getActivityColor(iconType);
              const pointsLabel = getPointsLabel(event);
              const targetHours = event.target_minutes
                ? Math.round(event.target_minutes / 60)
                : null;
              const participating = userParticipation.includes(event.id);

              return (
                <Link key={event.id} to="/challenges/$id" params={{ id: event.id }}>
                  <m.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(cardIndex * 0.05, 0.4), duration: 0.25 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex items-start gap-3 cursor-pointer opacity-80"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {getActivityIcon(iconType, 30)}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#1B5E4B] leading-snug truncate">
                            {event.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#62988a" }}>
                            {formatEventDate(event.start_date, "d MMM")} –{" "}
                            {formatEventDate(event.end_date, "d MMM")}
                          </p>
                        </div>
                        <ChevronRight size={32} className="shrink-0" style={{ color: "#548f7f" }} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}
                          >
                            <CalendarClock size={10} />
                            Starts {formatEventDate(event.start_date, "d MMM")}
                          </span>
                          <Badge
                            variant="outline"
                            className="capitalize text-xs px-2 py-0 h-5 border-0"
                            style={{ backgroundColor: "#f0f5f4", color: "#3e7c6c" }}
                          >
                            {event.event_type}
                          </Badge>
                          {event.is_student_suggested && (
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                            >
                              <GraduationCap size={10} />
                              Student Suggested
                            </span>
                          )}
                          {targetHours && (
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#f0f5f4", color: "#3e7c6c" }}
                            >
                              <Clock size={11} />
                              {targetHours} {targetHours === 1 ? "hour" : "hours"}
                            </span>
                          )}
                          {participating && (
                            <span className="text-xs font-medium text-[#0F8061]">Joined</span>
                          )}
                        </div>
                        {pointsLabel && (
                          <span
                            className="text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: "#FEE9E8", color: "#EF4250" }}
                          >
                            {pointsLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </m.div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {currentEvents.length === 0 && comingSoonEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {showJoinedOnly ? "You haven't joined any challenges yet." : "No challenges found."}
          </p>
        </div>
      )}

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
        onEventCreated={fetchEvents}
      />
    </div>
  );
};

export default EventsContent;
