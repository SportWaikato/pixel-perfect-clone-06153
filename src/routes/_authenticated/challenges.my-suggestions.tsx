import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import MySuggestionsContent from "@/modules/events/components/MySuggestionsContent";

export const Route = createFileRoute("/_authenticated/challenges/my-suggestions")({
  head: () => ({ meta: [{ title: "My Suggestions — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return <MySuggestionsContent user={profile as UserInterface} />;
}
