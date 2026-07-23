import { createFileRoute } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { SchoolService } from "@/models/schools/services/SchoolService";
import ReportsContent from "@/modules/admin/components/ReportsContent";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const [schools, setSchools] = useState<SchoolInterface[]>([]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const schoolService = new SchoolService(supabase);
    schoolService.getAll(true).then(setSchools).catch(() => {});
  }, []);

  if (!profile) return null;
  return <ReportsContent user={profile as UserInterface} schools={schools} currentTerm={null} />;
}
