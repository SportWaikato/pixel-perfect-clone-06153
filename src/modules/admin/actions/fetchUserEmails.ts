import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const fetchUserEmails = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const { userIds } = input as { userIds: string[] };
    if (!Array.isArray(userIds)) throw new Error("userIds must be an array");
    return { userIds };
  })
  .handler(async ({ data }) => {
    if (!data.userIds.length) return {};

    const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SW_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: rpcData, error } = await adminClient.rpc("get_user_emails_by_ids", {
      user_ids: data.userIds,
    });
    if (error) throw new Error(error.message);

    return Object.fromEntries(
      (rpcData as { id: string; email: string }[]).map((row) => [row.id, row.email]),
    );
  });
