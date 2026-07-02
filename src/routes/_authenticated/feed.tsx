import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import SchoolFeedContent from "@/modules/activities/components/SchoolFeedContent";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({ meta: [{ title: "School Feed — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  const user = profile as UserInterface;

  if (!user.school_id) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">School Feed</h1>
        <p className="text-gray-500 mt-4">Join a school to see the feed.</p>
      </div>
    );
  }

  return <SchoolFeedContent schoolId={user.school_id} userId={user.id} />;
}
