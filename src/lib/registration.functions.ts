import { createServerFn } from "@tanstack/react-start";

export const approveSchool = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const { schoolId } = input as { schoolId: string };
    if (!schoolId) throw new Error("schoolId required");
    return { schoolId };
  })
  .handler(async ({ data }) => {
    // SSR guard — prevent accidental client bundle inclusion
    if (!import.meta.env.SSR) throw new Error("This function can only run server-side");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail } = await import("@/lib/sendEmail");
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
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let joinCode = "";
    for (let i = 0; i < 8; i++) joinCode += chars[Math.floor(Math.random() * chars.length)];

    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from("schools")
        .select("id")
        .eq("join_code", joinCode)
        .maybeSingle();
      if (!existing) break;
      joinCode = "";
      for (let i = 0; i < 8; i++) joinCode += chars[Math.floor(Math.random() * chars.length)];
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
        await sendEmail({ data: { to: adminEmail, subject, html } });
      } catch (err) {
        console.error("Failed to send approval email:", err);
      }
    }

    return { ok: true, joinCode };
  });

export const rejectSchool = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const { schoolId, reason } = input as { schoolId: string; reason: string };
    if (!schoolId) throw new Error("schoolId required");
    if (!reason) throw new Error("reason required");
    return { schoolId, reason: reason.trim() };
  })
  .handler(async ({ data }) => {
    if (!import.meta.env.SSR) throw new Error("This function can only run server-side");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail } = await import("@/lib/sendEmail");
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
        await sendEmail({ data: { to: adminEmail, subject, html } });
      } catch (err) {
        console.error("Failed to send rejection email:", err);
      }
    }

    return { ok: true };
  });

export const regenerateJoinCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const { schoolId } = input as { schoolId: string };
    if (!schoolId) throw new Error("schoolId required");
    return { schoolId };
  })
  .handler(async ({ data }) => {
    if (!import.meta.env.SSR) throw new Error("This function can only run server-side");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let joinCode = "";
    for (let i = 0; i < 8; i++) joinCode += chars[Math.floor(Math.random() * chars.length)];

    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from("schools")
        .select("id")
        .eq("join_code", joinCode)
        .maybeSingle();
      if (!existing) break;
      joinCode = "";
      for (let i = 0; i < 8; i++) joinCode += chars[Math.floor(Math.random() * chars.length)];
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
    return { domain: domain.toLowerCase().trim() };
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
