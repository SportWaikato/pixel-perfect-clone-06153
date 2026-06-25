import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({ meta: [{ title: "Achievements — Karawhiua" }] }),
  component: () => (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader><CardTitle>Achievements</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Achievements grid will be wired in the next pass.
        </CardContent>
      </Card>
    </div>
  ),
});
