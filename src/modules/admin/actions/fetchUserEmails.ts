import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchUserEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { userIds } = input as { userIds: string[] };
    if (!Array.isArray(userIds)) throw new Error("userIds must be an array");
    if (!userIds.every((id) => typeof id === "string")) {
      throw new Error("userIds must be strings");
    }
    return { userIds };
  })
  .handler(async ({ data, context }) => {
    if (!data.userIds.length) return {} as Record<string, string>;

    // Authorize: only school_admin or super_admin may look up emails.
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (!caller || (caller.role !== "school_admin" && caller.role !== "super_admin")) {
      throw new Error("Forbidden");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rpcData, error } = await supabaseAdmin.rpc("get_user_emails_by_ids", {
      user_ids: data.userIds,
    });
    if (error) throw new Error(error.message);

    return Object.fromEntries(
      (rpcData as { id: string; email: string }[]).map((row) => [row.id, row.email]),
    );
  });
