import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { EventService } from "@/models/events/services/EventService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/application/components/DesignSystem/ui/tabs";
import { Plus, Clock, CheckCircle, XCircle, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { formatEventDate } from "@/modules/common/utils/dateUtils";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import CreateEventDialog from "@/modules/admin/components/CreateEventDialog";
import EditEventDialog from "@/modules/admin/components/EditEventDialog";

const eventService = new EventService(createSupabaseClient());

export const Route = createFileRoute("/_authenticated/_admin/school/events")({
  head: () => ({ meta: [{ title: "School Events — Karawhiua" }] }),
  beforeLoad: async ({ context }) => {
    const profile = context.profile as UserInterface | null;
    if (!profile?.school_id) return { events: [] as EventInterface[] };

    const supabase = createSupabaseClient();
    const svc = new EventService(supabase);
    const events = await svc.getBySchoolId(profile.school_id);
    return { events };
  },
  component: Page,
});

function Page() {
  const { profile, events: initialEvents } = Route.useRouteContext();
  const user = profile as UserInterface;
  const schoolId = user?.school_id;

  const [events, setEvents] = useState<EventInterface[]>((initialEvents as EventInterface[]) || []);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventInterface | null>(null);
  const [activeTab, setActiveTab] = useState("published");

  const refresh = useCallback(async () => {
    if (!schoolId) return;
    try {
      const data = await eventService.getBySchoolId(schoolId);
      setEvents(data);
    } catch (error) {
      notifyAboutError(error);
    }
  }, [schoolId]);

  if (!profile) return null;

  const published = events.filter((e) => e.is_published);
  const drafts = events.filter((e) => !e.is_published && e.approval_status !== "rejected");
  const rejected = events.filter((e) => e.approval_status === "rejected");

  const currentList =
    activeTab === "published" ? published : activeTab === "drafts" ? drafts : rejected;

  const handlePublish = async (event: EventInterface) => {
    try {
      await eventService.update(event.id, { ...event, is_published: true });
      toast.success("Event published");
      refresh();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleUnpublish = async (event: EventInterface) => {
    try {
      await eventService.update(event.id, { ...event, is_published: false });
      toast.success("Event unpublished");
      refresh();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleDelete = async (event: EventInterface) => {
    try {
      await eventService.deleteEvent(event.id);
      toast.success("Event deleted");
      refresh();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const getStatusBadge = (event: EventInterface) => {
    if (event.is_published) {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle size={10} />
          Published
        </Badge>
      );
    }
    if (event.approval_status === "rejected") {
      return (
        <Badge className="bg-red-100 text-red-800 gap-1">
          <XCircle size={10} />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 gap-1">
        <Clock size={10} />
        Draft
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none tracking-tight text-brand-green">
            School Events
          </h1>
          <p className="text-gray-600 mt-2">Manage challenges and events for your school</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2"
          style={{ backgroundColor: "#1B5E4B" }}
        >
          <Plus size={16} />
          Create Event
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        {currentList.length === 0 ? (
          <Card className="shadow-sm rounded-2xl border border-gray-200">
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="font-medium text-gray-700">No {activeTab} events</p>
              <p className="text-sm text-gray-500 mt-2">
                {activeTab === "published"
                  ? "Publish an event to make it visible to students."
                  : activeTab === "unpublished"
                    ? "Unpublished events are hidden from students."
                    : "Save an event as a draft to finish it later."}
              </p>
            </CardContent>
          </Card>
        ) : (
          currentList.map((event) => (
            <Card key={event.id} className="shadow-sm rounded-2xl border border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#1B5E4B18", color: "#1B5E4B" }}
                  >
                    {event.icon_type || <Clock size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#1B5E4B] truncate">{event.name}</h3>
                      {getStatusBadge(event)}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 break-words whitespace-pre-wrap mb-2">
                        {event.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatEventDate(event.start_date, "d MMM yyyy")} –{" "}
                      {formatEventDate(event.end_date, "d MMM yyyy")}
                      {event.challenge_points && event.challenge_points > 0 && (
                        <span className="ml-2">· {event.challenge_points} pts</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!event.is_published ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePublish(event)}
                        className="gap-1"
                      >
                        <Eye size={14} />
                        Publish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnpublish(event)}
                        className="gap-1"
                      >
                        <EyeOff size={14} />
                        Unpublish
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditEvent(event)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(event)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateEventDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        user={user}
        onEventCreated={refresh}
      />

      {editEvent && (
        <EditEventDialog
          event={editEvent}
          open={!!editEvent}
          onOpenChange={(open) => {
            if (!open) setEditEvent(null);
          }}
          onEventUpdated={refresh}
          user={user}
        />
      )}
    </div>
  );
}
