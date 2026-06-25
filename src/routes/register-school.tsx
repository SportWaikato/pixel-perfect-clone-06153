import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/register-school")({
  head: () => ({ meta: [{ title: "Register your school — Karawhiua" }] }),
  component: () => (
    <div className="min-h-screen p-6 flex items-center justify-center bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader><CardTitle>Register your school</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Self-service school registration is coming in the next pass. For now, contact the Karawhiua team.
        </CardContent>
      </Card>
    </div>
  ),
});
