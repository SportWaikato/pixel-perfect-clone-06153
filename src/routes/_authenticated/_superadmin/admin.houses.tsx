import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import HouseManagementContent from "@/modules/admin/components/HouseManagementContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/houses")({
  head: () => ({ meta: [{ title: "Houses — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  if (!profile) return null;
  // @ts-expect-error — minimal props for stub
  return <HouseManagementContent user={profile as UserInterface} initialHouses={[]} schools={[]} />;
}
