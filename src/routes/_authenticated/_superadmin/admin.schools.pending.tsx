import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/schools/pending")({
  head: () => ({ meta: [{ title: "Pending schools — Karawhiua" }] }),
  component: () => (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader><CardTitle>Pending school approvals</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Pending school approvals component will be built in the next pass.
        </CardContent>
      </Card>
    </div>
  ),
});
