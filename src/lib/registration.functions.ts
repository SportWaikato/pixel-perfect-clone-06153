import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const JOIN_CODE_LENGTH = 8;

function generateJoinCode(): string {
  const bytes = new Uint8Array(JOIN_CODE_LENGTH * 2);
  let code = "";
  while (code.length < JOIN_CODE_LENGTH) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (code.length >= JOIN_CODE_LENGTH) break;
      const max = 256 - (256 % JOIN_CODE_ALPHABET.length);
      if (byte < max) code += JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length];
    }
  }
  return code;
}

// Rollback for a failed self-registration: deletes the CALLER'S OWN auth
// account, and only while it has no profile row yet (i.e. genuinely
// mid-registration). The browser client cannot call auth.admin APIs, so this
// is the only place that cleanup can actually happen.
export const cleanupOwnFailedRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from("users")
      .select("id")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (profile) throw new Error("Account already has a profile — refusing to delete");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const approveSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { schoolId } = input as { schoolId: string };
    if (!schoolId) throw new Error("schoolId required");
    return { schoolId };
  })
  .handler(async ({ data, context }) => {
    // Runs with the service-role client below, so the caller's role must be
    // verified first — the middleware only proves authentication.
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (caller?.role !== "super_admin") throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmailServer } = await import("@/lib/sendEmail");
    const { schoolApproved } = await import("@/emails/index");

    // Get school info and admin user
    const { data: school, error: schoolErr } = await supabaseAdmin
      .from("schools")
      .select("name, email_domain")
      .eq("id", data.schoolId)
      .single();
    if (schoolErr || !school) throw new Error("School not found");

    // Find admin user for this school
    const { data: admin } = await supabaseAdmin
      .from("users")
      .select("id, first_name")
      .eq("school_id", data.schoolId)
      .eq("role", "school_admin")
      .single();

    let adminEmail = "";
    let firstName = "Admin";
    if (admin) {
      firstName = admin.first_name || "Admin";
      // Get email from auth
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(admin.id);
      adminEmail = authUser?.user?.email || "";
    }

    // Generate unique join code
    let joinCode = generateJoinCode();

    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from("schools")
        .select("id")
        .eq("join_code", joinCode)
        .maybeSingle();
      if (!existing) break;
      joinCode = generateJoinCode();
      attempts++;
    }

    const { error: updateErr } = await supabaseAdmin
      .from("schools")
      .update({
        is_active: true,
        status: "approved",
        join_code: joinCode,
        join_link_active: true,
        approved_at: new Date().toISOString(),
      })
      .eq("id", data.schoolId);

    if (updateErr) throw new Error(updateErr.message);

    // Send approval email
    if (adminEmail) {
      try {
        const { subject, html } = schoolApproved(
          firstName,
          school.name,
          joinCode,
          school.email_domain || "school.nz",
        );
        await sendEmailServer({ to: adminEmail, subject, html });
      } catch (err) {
        console.error("Failed to send approval email:", err);
      }
    }

    return { ok: true, joinCode };
  });

export const rejectSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { schoolId, reason } = input as { schoolId: string; reason: string };
    if (!schoolId) throw new Error("schoolId required");
    if (!reason) throw new Error("reason required");
    return { schoolId, reason: reason.trim() };
  })
  .handler(async ({ data, context }) => {
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (caller?.role !== "super_admin") throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmailServer } = await import("@/lib/sendEmail");
    const { schoolRejected } = await import("@/emails/index");

    // Get school info and admin user
    const { data: school, error: schoolErr } = await supabaseAdmin
      .from("schools")
      .select("name")
      .eq("id", data.schoolId)
      .single();
    if (schoolErr || !school) throw new Error("School not found");

    const { data: admin } = await supabaseAdmin
      .from("users")
      .select("id, first_name")
      .eq("school_id", data.schoolId)
      .eq("role", "school_admin")
      .single();

    let adminEmail = "";
    let firstName = "Admin";
    if (admin) {
      firstName = admin.first_name || "Admin";
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(admin.id);
      adminEmail = authUser?.user?.email || "";
    }

    const { error: updateErr } = await supabaseAdmin
      .from("schools")
      .update({
        status: "rejected",
        rejection_reason: data.reason,
      })
      .eq("id", data.schoolId);

    if (updateErr) throw new Error(updateErr.message);

    if (adminEmail) {
      try {
        const { subject, html } = schoolRejected(firstName, school.name, data.reason);
        await sendEmailServer({ to: adminEmail, subject, html });
      } catch (err) {
        console.error("Failed to send rejection email:", err);
      }
    }

    return { ok: true };
  });

export const regenerateJoinCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const { schoolId } = input as { schoolId: string };
    if (!schoolId) throw new Error("schoolId required");
    return { schoolId };
  })
  .handler(async ({ data, context }) => {
    // Super admins may regenerate any school's code; school admins only their own.
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role, school_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    const isSuperAdmin = caller?.role === "super_admin";
    const isOwnSchoolAdmin = caller?.role === "school_admin" && caller.school_id === data.schoolId;
    if (!isSuperAdmin && !isOwnSchoolAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let joinCode = generateJoinCode();

    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from("schools")
        .select("id")
        .eq("join_code", joinCode)
        .maybeSingle();
      if (!existing) break;
      joinCode = generateJoinCode();
      attempts++;
    }

    const { error } = await supabaseAdmin
      .from("schools")
      .update({ join_code: joinCode, join_link_active: true })
      .eq("id", data.schoolId);

    if (error) throw new Error(error.message);
    return { joinCode };
  });

export const checkDomainAvailable = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const { domain } = input as { domain: string };
    if (!domain) throw new Error("domain required");
    const normalized = domain.toLowerCase().trim();
    // Interpolated into a PostgREST .or() filter below — restrict to hostname
    // characters so filter syntax (commas, parens, dots are fine) can't be injected.
    if (!/^[a-z0-9][a-z0-9.-]{0,252}$/.test(normalized)) {
      throw new Error("Invalid domain");
    }
    return { domain: normalized };
  })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient<import("@/integrations/supabase/types").Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: rows } = await sb
      .from("schools")
      .select("id")
      .or(`email_domain.eq.${data.domain},secondary_email_domain.eq.${data.domain}`)
      .limit(1);
    return { available: !rows || rows.length === 0 };
  });
