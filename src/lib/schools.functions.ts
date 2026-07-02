import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicSupabase() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listSchools = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicSupabase();
  const { data, error } = await sb
    .from("schools")
    .select("id, name, code, is_active, is_internal, registration_method")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).filter((s) => !s.is_internal);
});

export const listHousesBySchool = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object" || !("schoolId" in input)) {
      throw new Error("schoolId required");
    }
    const { schoolId } = input as { schoolId: string };
    if (typeof schoolId !== "string" || schoolId.length === 0) throw new Error("schoolId required");
    return { schoolId };
  })
  .handler(async ({ data }) => {
    const sb = publicSupabase();
    const { data: rows, error } = await sb
      .from("houses")
      .select("id, name, color, school_id")
      .eq("school_id", data.schoolId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
