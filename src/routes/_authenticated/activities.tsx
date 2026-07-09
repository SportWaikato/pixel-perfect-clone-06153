import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import ActivitiesContent from "@/modules/activities/components/ActivitiesContent";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { EventService } from "@/models/events/services/EventService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";

export const Route = createFileRoute("/_authenticated/activities")({
  head: () => ({ meta: [{ title: "Activities — Karawhiua" }] }),
  beforeLoad: async ({ context }) => {
    const profile = context.profile as UserInterface | null;
    if (!profile)
      return { challenges: [] as EventInterface[], activities: [] as ActivityInterface[] };

    const supabase = createSupabaseClient();
    const activityService = new ActivityService(supabase);
    const eventService = new EventService(supabase);

    const [activities, challenges] = await Promise.all([
      activityService.getByUserId(profile.id, 20),
      eventService.getBySchoolId(profile.school_id),
    ]);

    return { challenges, activities };
  },
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const { challenges = [], activities = [] } = Route.useRouteContext();
  if (!profile) return null;
  return (
    <ActivitiesContent
      user={profile as UserInterface}
      initialActivities={activities as ActivityInterface[]}
      initialChallenges={challenges as EventInterface[]}
    />
  );
}
