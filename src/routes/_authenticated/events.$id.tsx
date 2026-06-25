import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import IndividualEventContent from "@/modules/events/components/IndividualEventContent";

export const Route = createFileRoute("/_authenticated/events/$id")({
  head: () => ({ meta: [{ title: "Event — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <IndividualEventContent user={profile as UserInterface} eventId={id} />;
}
