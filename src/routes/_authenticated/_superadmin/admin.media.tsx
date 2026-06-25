import { createFileRoute } from "@tanstack/react-router";
import AssetManagementContent from "@/modules/admin/components/assets/AssetManagementContent";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/media")({
  head: () => ({ meta: [{ title: "Media — Karawhiua" }] }),
  component: () => <AssetManagementContent />,
});
