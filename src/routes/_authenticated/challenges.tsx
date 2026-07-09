import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import EventsContent from "@/modules/events/components/EventsContent";

export const Route = createFileRoute("/_authenticated/challenges")({
  head: () => ({ meta: [{ title: "Challenges — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!profile) return null;

  if (pathname === "/challenges") {
    return (
      <EventsContent
        user={profile as UserInterface}
        initialEvents={[]}
        initialParticipation={[]}
        initialEventProgress={{}}
      />
    );
  }

  return <Outlet />;
}
