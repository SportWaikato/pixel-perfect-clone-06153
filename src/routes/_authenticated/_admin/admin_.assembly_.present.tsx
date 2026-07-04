import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import AssemblyPresentationContent from "@/modules/admin/components/assembly/AssemblyPresentationContent";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { UserService } from "@/models/users/services/UserService";
import { EventService } from "@/models/events/services/EventService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";

type PresentSearch = {
  schoolId?: string;
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
};

export const Route = createFileRoute("/_authenticated/_admin/admin_/assembly_/present")({
  validateSearch: (s: Record<string, unknown>): PresentSearch => ({
    schoolId: typeof s.schoolId === "string" ? s.schoolId : undefined,
    startDate: typeof s.startDate === "string" ? s.startDate : undefined,
    endDate: typeof s.endDate === "string" ? s.endDate : undefined,
    periodLabel: typeof s.periodLabel === "string" ? s.periodLabel : undefined,
  }),
  head: () => ({ meta: [{ title: "Assembly Presentation — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const search = Route.useSearch();
  const user = profile as UserInterface | null;

  // School admins may only present their own school; super admins any school.
  const schoolId =
    user?.role === "super_admin"
      ? (search.schoolId ?? user?.school_id ?? "")
      : (user?.school_id ?? "");

  const [students, setStudents] = useState<UserInterface[] | null>(null);
  const [assemblyEvent, setAssemblyEvent] = useState<EventInterface | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setStudents([]);
      return;
    }
    const supabase = createSupabaseClient();
    const userService = new UserService(supabase);
    const eventService = new EventService(supabase);
    Promise.all([
      userService.getUsersWithRankings({ school_id: schoolId }),
      eventService.getAssemblyEvent(schoolId),
    ])
      .then(([schoolUsers, event]) => {
        setStudents(schoolUsers.filter((u) => u.role === "student"));
        setAssemblyEvent(event);
      })
      .catch((err) => {
        notifyAboutError(err);
        setStudents([]);
      });
  }, [schoolId]);

  if (!user) return null;

  if (students === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading assembly…</p>
      </div>
    );
  }

  return (
    <AssemblyPresentationContent
      schoolId={schoolId}
      currentUser={user}
      students={students}
      assemblyEvent={assemblyEvent}
      startDate={search.startDate}
      endDate={search.endDate}
      periodLabel={search.periodLabel}
    />
  );
}
