import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import KoreroVotingForm from "@/modules/korero/components/KoreroVotingForm";

export const Route = createFileRoute("/_authenticated/korero")({
  head: () => ({ meta: [{ title: "Kōrero — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <KoreroVotingForm user={profile as UserInterface} />
    </div>
  );
}
