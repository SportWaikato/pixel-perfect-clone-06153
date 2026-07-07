import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SuperAdminInviteInterface } from "@/models/invites/interfaces/SuperAdminInviteInterface";

export const listSuperAdminInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (caller?.role !== "super_admin") throw new Error("Forbidden");

    const { InviteService } = await import("@/models/invites/services/InviteService");
    const service = new InviteService(context.supabase);
    return service.list();
  });

export const createSuperAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { email } = input as { email: string };
    if (typeof email !== "string" || !email.includes("@")) {
      throw new Error("Valid email required");
    }
    return { email: email.trim().toLowerCase() };
  })
  .handler(async ({ data, context }) => {
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (caller?.role !== "super_admin") throw new Error("Forbidden");

    const { InviteService } = await import("@/models/invites/services/InviteService");
    const service = new InviteService(context.supabase);
    const invite = await service.create(data.email, context.userId);

    const baseUrl = import.meta.env.VITE_APP_URL || "";
    const url = `${baseUrl}/invite/${invite.token}`;

    return { invite, url };
  });

export const revokeSuperAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { id } = input as { id: string };
    if (typeof id !== "string" || id.length === 0) throw new Error("id required");
    return { id };
  })
  .handler(async ({ data, context }) => {
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (caller?.role !== "super_admin") throw new Error("Forbidden");

    const { InviteService } = await import("@/models/invites/services/InviteService");
    const service = new InviteService(context.supabase);
    await service.revoke(data.id);
    return { ok: true };
  });

export const acceptSuperAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { token, username, firstName, lastName } = input as {
      token: string;
      username: string;
      firstName: string;
      lastName: string;
    };
    if (typeof token !== "string" || token.length === 0) throw new Error("token required");
    if (typeof username !== "string" || username.length < 3) throw new Error("username required");
    if (typeof firstName !== "string" || firstName.length === 0) {
      throw new Error("firstName required");
    }
    if (typeof lastName !== "string" || lastName.length === 0) throw new Error("lastName required");
    return { token, username, firstName, lastName };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    if (authError || !authUser?.user?.email) throw new Error("Could not verify user identity");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC not yet in generated types
    const { data: rpcResult, error: rpcError } = await (supabaseAdmin.rpc as any)(
      "accept_super_admin_invite",
      {
        p_token: data.token,
        p_email: authUser.user.email,
        p_username: data.username,
        p_first_name: data.firstName,
        p_last_name: data.lastName,
      },
    );
    if (rpcError) throw new Error(rpcError.message);

    if (!rpcResult) throw new Error("Invite is invalid, expired, or already used");

    return { ok: true };
  });
