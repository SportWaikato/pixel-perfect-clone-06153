import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Karawhiua" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Analytics dashboard coming soon.</p>
      </div>
      <Card className="shadow-sm rounded-2xl border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <BarChart3 size={48} className="text-gray-300" />
          <p className="font-medium text-gray-700">Analytics Dashboard</p>
          <p className="text-sm text-gray-500">
            Detailed analytics and insights will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
