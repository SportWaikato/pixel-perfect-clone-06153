import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { EventInterface } from '@/models/events/interfaces/EventInterface';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/application/components/DesignSystem/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { EventService } from '@/models/events/services/EventService';
import { isSuperAdmin as checkIsSuperAdmin } from '@/modules/auth/utils/roleUtils';
import { CheckCircle, XCircle, Clock, Plus, ArrowLeft, Calendar, Users, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { formatEventDate } from '@/modules/common/utils/dateUtils';
import { Link } from '@tanstack/react-router';
const CreateEventDialog = React.lazy(() => import('./CreateEventDialog'));
const EditEventDialog = React.lazy(() => import('./EditEventDialog'));

interface EventApprovalContentProps {
  user: UserInterface;
  schools?: SchoolInterface[];
  initialSchoolId?: string;
}

const EventApprovalContent = ({ user, schools, initialSchoolId }: EventApprovalContentProps) => {
  const isSuperAdmin = checkIsSuperAdmin(user);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(
    isSuperAdmin ? (initialSchoolId ?? null) : user.school_id
  );

  const [pendingEvents, setPendingEvents] = useState<EventInterface[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<EventInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState<EventInterface | null>(null);

  const eventService = useMemo(() => new EventService(createSupabaseClient()), []);

  const fetchEvents = async (schoolId: string | null) => {
    try {
      setLoading(true);
      const [pending, approved] = await Promise.all([
        schoolId
          ? eventService.getPendingEventsForSchool(schoolId)
          : eventService.getAllPendingEvents(),
        eventService.getApprovedEvents({
          viewerRole: user.role,
          viewerSchoolId: schoolId,
        }),
      ]);

      setPendingEvents(pending);
      // For super admin with a specific school selected, filter approved events client-side
      if (isSuperAdmin && schoolId) {
        setApprovedEvents(approved.filter(event =>
          !event.target_schools || event.target_schools.length === 0 || event.target_schools.includes(schoolId)
        ));
      } else {
        setApprovedEvents(approved);
      }
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin && !selectedSchoolId) return;
    fetchEvents(selectedSchoolId);
  }, [selectedSchoolId]);

  const handleSchoolChange = (value: string) => {
    setSelectedSchoolId(value === 'all' ? null : value);
  };

  const selectedSchoolName = selectedSchoolId
    ? schools?.find(s => s.id === selectedSchoolId)?.name ?? user.school?.name
    : null;

  const backHref = isSuperAdmin
    ? (selectedSchoolId ? `/admin/dashboard?schoolId=${selectedSchoolId}` : '/admin')
    : '/admin/dashboard';

  const subtitle = isSuperAdmin
    ? (selectedSchoolName ?? 'All Schools')
    : (user.school?.name ?? '');

  const handleApproveEvent = async (eventId: string) => {
    try {
      await eventService.approveEvent(eventId, user.id);
      toast.success('Challenge approved successfully!');
      fetchEvents(selectedSchoolId);
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      await eventService.rejectEvent(eventId, user.id);
      toast.success('Challenge rejected');
      fetchEvents(selectedSchoolId);
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleEditEvent = (event: EventInterface) => {
    setEventBeingEdited(event);
    setShowEditDialog(true);
  };

  const handlePublishEvent = async (eventId: string) => {
    try {
      await eventService.publishEvent(eventId);
      toast.success('Challenge published');
      fetchEvents(selectedSchoolId);
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleUnpublishEvent = async (eventId: string) => {
    try {
      await eventService.unpublishEvent(eventId);
      toast.success('Challenge unpublished');
      fetchEvents(selectedSchoolId);
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleDeleteEvent = async (event: EventInterface) => {
    const shouldDelete = window.confirm(
      `Delete "${event.name}"? Participants will no longer see this challenge.`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await eventService.deleteEvent(event.id);
      toast.success('Challenge removed');
      fetchEvents(selectedSchoolId);
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'running': return '#EF4250';
      case 'cycling': return '#00ACEF';
      case 'mixed': return '#803E93';
      default: return '#19AA4B';
    }
  };

  const EventCard = ({
    event,
    showActions = false,
    onEdit,
    onDelete,
    onPublish,
    onUnpublish,
  }: {
    event: EventInterface;
    showActions?: boolean;
    onEdit?: (event: EventInterface) => void;
    onDelete?: (event: EventInterface) => void;
    onPublish?: (eventId: string) => void;
    onUnpublish?: (eventId: string) => void;
  }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              {event.name}
              <Badge
                variant="secondary"
                style={{ backgroundColor: getEventTypeColor(event.event_type), color: 'white' }}
              >
                {event.event_type}
              </Badge>
            </CardTitle>
            {(event as any).creator && (
              <p className="text-sm text-gray-600 mt-1">
                Created by {(event as any).creator.first_name} {(event as any).creator.last_name} (@{(event as any).creator.username})
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Users size={14} />
                {event.participant_count}
              </div>
              {onEdit && !onDelete && (
                <div className="flex gap-2">
                  <Link to={`/events/${event.id}`} target="_blank">
                    <Button type="button" variant="outline" size="sm">
                      <ExternalLink size={14} />
                      View
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(event)}
                  >
                    <Pencil size={14} />
                    Edit
                  </Button>
                </div>
              )}
            </div>
            {onEdit && onDelete && (
              <div className="flex gap-2 flex-wrap justify-end">
                {onPublish && onUnpublish && (
                  event.is_published ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onUnpublish(event.id)}
                    >
                      <EyeOff size={14} />
                      Unpublish
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onPublish(event.id)}
                      style={{ borderColor: '#19AA4B', color: '#19AA4B' }}
                    >
                      <Eye size={14} />
                      Publish
                    </Button>
                  )
                )}
                <Link to={`/events/${event.id}`} target="_blank">
                  <Button type="button" variant="outline" size="sm">
                    <ExternalLink size={14} />
                    View
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(event)}
                >
                  <Pencil size={14} />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(event)}
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-3">
            {event.event_image_url && (
              <img
                src={event.event_image_url}
                alt=""
                className="w-28 h-20 rounded-lg object-cover shrink-0"
              />
            )}
            <p className="text-gray-700 flex-1">{event.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {formatEventDate(event.start_date, 'MMM d')} - {formatEventDate(event.end_date, 'MMM d')}
            </div>
            {event.target_minutes && (
              <div>Target: {Math.round(event.target_minutes / 60)} hours</div>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleApproveEvent(event.id)}
                className="flex-1 gap-2"
                style={{ backgroundColor: '#19AA4B' }}
              >
                <CheckCircle size={16} />
                Approve
              </Button>
              <Button
                onClick={() => handleRejectEvent(event.id)}
                variant="destructive"
                className="flex-1 gap-2"
              >
                <XCircle size={16} />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backHref}>
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Challenge Management</h1>
            <p className="text-gray-600">
              {loading ? 'Loading…' : `Managing challenges for ${subtitle}`}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
          style={{ backgroundColor: '#0B4B39' }}
        >
          <Plus size={16} />
          Create Challenge
        </Button>
      </div>

      {/* School selector (super_admin only) */}
      {isSuperAdmin && schools && schools.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">School</label>
          <Select
            value={selectedSchoolId ?? 'all'}
            onValueChange={handleSchoolChange}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="All Schools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map(school => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tabs */}
      {(() => {
        const publishedEvents = approvedEvents.filter(e => e.is_published);
        const unpublishedEvents = approvedEvents.filter(e => !e.is_published);
        return (
          <Tabs defaultValue={pendingEvents.length === 0 ? 'published' : 'pending'} className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock size={16} />
                Pending Approval ({pendingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="published" className="gap-2">
                <Eye size={16} />
                Published ({publishedEvents.length})
              </TabsTrigger>
              <TabsTrigger value="unpublished" className="gap-2">
                <EyeOff size={16} />
                Unpublished ({unpublishedEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="space-y-4">
                {pendingEvents.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Challenges</h3>
                      <p className="text-gray-600">
                        All student-created challenges have been reviewed. New challenges will appear here for approval.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingEvents.map(event => (
                    <EventCard key={event.id} event={event} showActions={true} onEdit={handleEditEvent} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="published">
              <div className="space-y-4">
                {publishedEvents.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Challenges</h3>
                      <p className="text-gray-600">
                        No challenges are currently published. Create a challenge or publish one from the Unpublished tab.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  publishedEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                      onPublish={handlePublishEvent}
                      onUnpublish={handleUnpublishEvent}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="unpublished">
              <div className="space-y-4">
                {unpublishedEvents.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <EyeOff className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Unpublished Challenges</h3>
                      <p className="text-gray-600">
                        All approved challenges are currently published.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  unpublishedEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                      onPublish={handlePublishEvent}
                      onUnpublish={handleUnpublishEvent}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        );
      })()}

      {/* Create Event Dialog */}
      <React.Suspense fallback={<div>Loading...</div>}><CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
        onEventCreated={() => fetchEvents(selectedSchoolId)}
      />

      <React.Suspense fallback={<div>Loading...</div>}><EditEventDialog
        open={showEditDialog}
        onOpenChange={open => {
          setShowEditDialog(open);
          if (!open) {
            setEventBeingEdited(null);
          }
        }}
        event={eventBeingEdited}
        onEventUpdated={() => fetchEvents(selectedSchoolId)}
        user={user}
      />
    </div>
  );
};

export default EventApprovalContent; 
