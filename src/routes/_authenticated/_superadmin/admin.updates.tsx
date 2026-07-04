import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import SchoolUpdatesContent from "@/modules/admin/components/SchoolUpdatesContent";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";

export const Route = createFileRoute("/_authenticated/_superadmin/admin/updates")({
  validateSearch: (s: Record<string, unknown>): { schoolId?: string } => ({
    schoolId: typeof s.schoolId === "string" ? s.schoolId : undefined,
  }),
  head: () => ({ meta: [{ title: "School Updates — Karawhiua" }] }),
  component: Page,
});

function Page() {
  const { profile } = Route.useRouteContext();
  const { schoolId } = Route.useSearch();
  const [schools, setSchools] = useState<SchoolInterface[]>([]);

  useEffect(() => {
    const schoolService = new SchoolService(createSupabaseClient());
    schoolService
      .getAll(true)
      .then(setSchools)
      .catch((err) => notifyAboutError(err));
  }, []);

  if (!profile) return null;
  const user = profile as UserInterface;
  return (
    <SchoolUpdatesContent
      user={user}
      schools={schools}
      initialSchoolId={schoolId ?? user.school_id}
      backHref="/admin"
    />
  );
}
