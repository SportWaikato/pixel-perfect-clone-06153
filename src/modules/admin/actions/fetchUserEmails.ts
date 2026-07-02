import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const fetchUserEmails = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const { userIds } = input as { userIds: string[] };
    if (!Array.isArray(userIds)) throw new Error("userIds must be an array");
    return { userIds };
  })
  .handler(async ({ context, data }) => {
    if (!data.userIds.length) return {};

    const authUser = (context as Record<string, unknown>)?.authUser as
      | Record<string, unknown>
      | undefined;
    if (!authUser?.id) {
      throw new Error("Unauthorized: must be signed in");
    }

    const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SW_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: roleData } = await adminClient
      .from("users")
      .select("role")
      .eq("id", authUser.id as string)
      .single();

    if (!roleData || (roleData.role !== "super_admin" && roleData.role !== "school_admin")) {
      throw new Error("Forbidden: admin access required");
    }

    const { data: rpcData, error } = await adminClient.rpc("get_user_emails_by_ids", {
      user_ids: data.userIds,
    });
    if (error) throw new Error(error.message);

    return Object.fromEntries(
      (rpcData as { id: string; email: string }[]).map((row) => [row.id, row.email]),
    );
  });
