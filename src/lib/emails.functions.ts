import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Sends the student welcome email to the authenticated caller. All content is
// derived server-side from the caller's own profile row, and the recipient is
// locked to the caller's auth email — nothing attacker-controllable.
export const sendStudentWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = typeof context.claims.email === "string" ? context.claims.email : "";
    if (!email) return { ok: false, error: "No email on account" };

    const { data: profile } = await context.supabase
      .from("users")
      .select("first_name, school_id, house_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile) return { ok: false, error: "Profile not found" };

    let schoolName = "";
    if (profile.school_id) {
      const { data: school } = await context.supabase
        .from("schools")
        .select("name")
        .eq("id", profile.school_id)
        .maybeSingle();
      schoolName = school?.name ?? "";
    }

    let houseName = "";
    let houseColour = "#1B5E4B";
    if (profile.house_id) {
      const { data: house } = await context.supabase
        .from("houses")
        .select("name, color")
        .eq("id", profile.house_id)
        .maybeSingle();
      houseName = house?.name ?? "";
      houseColour = house?.color ?? houseColour;
    }

    const { studentWelcome } = await import("@/emails/index");
    const { subject, html } = studentWelcome(
      profile.first_name ?? "",
      schoolName,
      houseName,
      houseColour,
    );

    const { sendEmailServer } = await import("@/lib/sendEmail");
    return sendEmailServer({ to: email, subject, html });
  });

// Sends the "registration pending" confirmation to the school admin who just
// registered. Caller must be the school_admin of a pending school; everything
// else is derived server-side.
export const notifySchoolRegistrationPending = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = typeof context.claims.email === "string" ? context.claims.email : "";
    if (!email) return { ok: false, error: "No email on account" };

    const { data: profile } = await context.supabase
      .from("users")
      .select("first_name, role, school_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile || profile.role !== "school_admin" || !profile.school_id) {
      return { ok: false, error: "Not a school admin" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("name, region, email_domain, status")
      .eq("id", profile.school_id)
      .maybeSingle();
    if (!school) return { ok: false, error: "School not found" };

    const { data: houses } = await supabaseAdmin
      .from("houses")
      .select("name")
      .eq("school_id", profile.school_id)
      .order("name", { ascending: true });
    const houseNames = (houses ?? []).map((h) => h.name).join(", ");

    const { schoolRegistrationPending } = await import("@/emails/index");
    const { subject, html } = schoolRegistrationPending(
      profile.first_name ?? "",
      school.name,
      school.region ?? "",
      school.email_domain ?? "",
      houseNames,
    );

    const { sendEmailServer } = await import("@/lib/sendEmail");
    return sendEmailServer({ to: email, subject, html });
  });
