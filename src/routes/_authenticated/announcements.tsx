import { createFileRoute } from "@tanstack/react-router";
import AnnouncementsPage from "@/modules/announcements/components/AnnouncementsPage";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();

  if (!profile) return null;

  return <AnnouncementsPage user={profile} />;
}
