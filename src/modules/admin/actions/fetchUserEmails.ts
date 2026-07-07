import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_BATCH_SIZE = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const fetchUserEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { userIds } = input as { userIds: string[] };
    if (!Array.isArray(userIds)) throw new Error("userIds must be an array");
    if (userIds.length > MAX_BATCH_SIZE) {
      throw new Error(`At most ${MAX_BATCH_SIZE} IDs may be requested at once`);
    }
    if (!userIds.every((id) => typeof id === "string" && UUID_RE.test(id))) {
      throw new Error("userIds must be valid UUIDs");
    }
    const uniqueIds = [...new Set(userIds)];
    return { userIds: uniqueIds };
  })
  .handler(async ({ data, context }) => {
    if (!data.userIds.length) return {} as Record<string, string>;

    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role, school_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (!caller || (caller.role !== "school_admin" && caller.role !== "super_admin")) {
      throw new Error("Forbidden");
    }

    let userIdsForRpc: string[];
    if (caller.role === "school_admin") {
      if (!caller.school_id) throw new Error("Forbidden");

      const { data: allowedRows, error: allowedError } = await context.supabase
        .from("users")
        .select("id")
        .eq("school_id", caller.school_id)
        .in("id", data.userIds);
      if (allowedError) throw new Error(allowedError.message);
      userIdsForRpc = (allowedRows ?? []).map((row) => row.id);
      if (!userIdsForRpc.length) return {} as Record<string, string>;
    } else {
      userIdsForRpc = data.userIds;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rpcData, error } = await supabaseAdmin.rpc("get_user_emails_by_ids", {
      user_ids: userIdsForRpc,
    });
    if (error) throw new Error(error.message);

    return Object.fromEntries(
      (rpcData as { id: string; email: string }[]).map((row) => [row.id, row.email]),
    );
  });
