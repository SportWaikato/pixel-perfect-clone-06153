import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/_admin/school/messages")({
  head: () => ({ meta: [{ title: "School Messages — Karawhiua" }] }),
  component: () => (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader><CardTitle>School Messages</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Wiring in next pass.</CardContent>
      </Card>
    </div>
  ),
});
