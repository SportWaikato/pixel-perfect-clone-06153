import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import EventsContent from "@/modules/events/components/EventsContent";

export const Route = createFileRoute("/_authenticated/challenges")({
  head: () => ({ meta: [{ title: "Challenges — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return (
    <EventsContent
      user={profile as UserInterface}
      initialEvents={[]}
      initialParticipation={[]}
      initialEventProgress={{}}
    />
  );
}
