import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { checkDomainAvailable } from "@/lib/registration.functions";

const REGIONS = [
  "Waikato", "Auckland", "Bay of Plenty", "Taranaki", "Manawatū-Whanganui",
  "Wellington", "Canterbury", "Otago", "Southland", "Northland",
];

const SCHOOL_TYPES = [
  "Primary", "Intermediate", "Secondary", "Full Primary", "Composite",
];

const HOUSE_TEMPLATES = [
  {
    name: "Classic",
    houses: [
      { name: "Kahurangi", color: "#1a5276" },
      { name: "Whero", color: "#c0392b" },
      { name: "Kōwhai", color: "#f39c12" },
      { name: "Kākāriki", color: "#27ae60" },
    ],
  },
  {
    name: "Bold",
    houses: [
      { name: "Māia", color: "#8e44ad" },
      { name: "Toa", color: "#d35400" },
      { name: "Tū", color: "#2980b9" },
      { name: "Aroha", color: "#e74c3c" },
    ],
  },
  {
    name: "Earth",
    houses: [
      { name: "Maunga", color: "#6c7a89" },
      { name: "Awa", color: "#3498db" },
      { name: "Rākau", color: "#2ecc71" },
      { name: "Whenua", color: "#8b4513" },
    ],
  },
];

export const Route = createFileRoute("/register-school")({
  ssr: false,
  component: RegisterSchoolPage,
});

function RegisterSchoolPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1 — School details
  const [schoolName, setSchoolName] = useState("");
  const [region, setRegion] = useState("");
  const [schoolType, setSchoolType] = useState("");

  // Step 2 — Email domains
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [secondaryDomain, setSecondaryDomain] = useState("");
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);

  // Step 3 — Houses
  const [houseTemplate, setHouseTemplate] = useState<string | null>(null);
  const [customHouses, setCustomHouses] = useState<{ name: string; color: string }[]>([]);

  // Step 4 — Admin account
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Check domain availability on change
  useEffect(() => {
    if (primaryDomain.length < 4 || !primaryDomain.includes(".")) {
      setDomainAvailable(null);
      return;
    }
    setCheckingDomain(true);
    checkDomainAvailable({ data: { domain: primaryDomain } })
      .then((result) => {
        setDomainAvailable(result?.available ?? null);
        setCheckingDomain(false);
      })
      .catch(() => { setDomainAvailable(null); setCheckingDomain(false); });
  }, [primaryDomain]);

  const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "protonmail.com"];

  const validateStep1 = () => {
    if (!schoolName.trim()) { toast.error("Enter your school name"); return false; }
    if (!region) { toast.error("Select your region"); return false; }
    if (!schoolType) { toast.error("Select your school type"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!primaryDomain) { toast.error("Enter your school email domain"); return false; }
    if (PERSONAL_DOMAINS.includes(primaryDomain)) { toast.error("Use your school domain, not a personal email domain"); return false; }
    if (domainAvailable === false) { toast.error("This domain is already registered to another school"); return false; }
    if (secondaryDomain && PERSONAL_DOMAINS.includes(secondaryDomain)) { toast.error("Secondary domain cannot be a personal domain"); return false; }
    return true;
  };

  const validateStep3 = () => {
    const houses = houseTemplate ? HOUSE_TEMPLATES.find((t) => t.name === houseTemplate)?.houses || [] : customHouses;
    if (houses.length < 2) { toast.error("Add at least 2 houses"); return false; }
    if (houses.some((h) => !h.name.trim())) { toast.error("Every house needs a name"); return false; }
    return true;
  };

  const validateStep4 = () => {
    if (!adminFirstName.trim()) { toast.error("Enter your first name"); return false; }
    if (!adminLastName.trim()) { toast.error("Enter your last name"); return false; }
    if (!adminEmail) { toast.error("Enter your email address"); return false; }
    if (!adminEmail.includes(primaryDomain)) { toast.error("Your email must use the school domain"); return false; }
    if (adminPassword.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
    if (!agreeTerms) { toast.error("You must agree to the terms"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;
    setSubmitting(true);

    const houses = houseTemplate
      ? HOUSE_TEMPLATES.find((t) => t.name === houseTemplate)?.houses || []
      : customHouses;

    try {
      // Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            first_name: adminFirstName.trim(),
            last_name: adminLastName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Failed to create account");

      // Insert school
      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: schoolName.trim(),
          region,
          school_type: schoolType,
          email_domain: primaryDomain,
          secondary_email_domain: secondaryDomain || null,
          status: "pending",
          is_active: false,
          self_registered: true,
        })
        .select("id")
        .single();

      if (schoolError) {
        // Clean up auth user
        await supabase.auth.admin.deleteUser(signUpData.user.id).catch(() => {});
        throw schoolError;
      }

      // Insert houses
      const { error: housesError } = await supabase
        .from("houses")
        .insert(
          houses.filter((h) => h.name.trim()).map((h) => ({
            school_id: school.id,
            name: h.name.trim(),
            color: h.color,
          })),
        );

      if (housesError) {
        await supabase.from("schools").delete().eq("id", school.id).catch(() => {});
        await supabase.auth.admin.deleteUser(signUpData.user.id).catch(() => {});
        throw housesError;
      }

      // Insert user
      const { error: userError } = await supabase.from("users").insert({
        id: signUpData.user.id,
        first_name: adminFirstName.trim(),
        last_name: adminLastName.trim(),
        username: adminEmail.split("@")[0],
        email: adminEmail,
        school_id: school.id,
        role: "school_admin",
        is_admin: true,
        is_active: true,
        is_public: false,
      });

      if (userError) throw userError;

      // Send confirmation email (best-effort)
      try {
        const { sendEmail } = await import("@/lib/sendEmail");
        const { schoolRegistrationPending } = await import("@/emails/index");
        const { subject, html } = schoolRegistrationPending(
          adminFirstName.trim(),
          schoolName.trim(),
          adminEmail,
        );
        await sendEmail({ data: { to: adminEmail, subject, html } });
      } catch (err) {
        console.error("Failed to send confirmation email:", err);
      }

      // Send notification to super admins
      try {
        const { data: superAdmins } = await supabase
          .from("users")
          .select("email")
          .eq("role", "super_admin")
          .not("email", "is", null);

        if (superAdmins?.length) {
          const { sendEmail } = await import("@/lib/sendEmail");
          await sendEmail({
            data: {
              to: superAdmins[0].email ?? "",
              subject: `New school registration: ${schoolName.trim()}`,
              html: `<p>${adminFirstName.trim()} ${adminLastName.trim()} from ${schoolName.trim()} has submitted a registration request.</p><p>Review it at <a href="https://app.karawhiua.app/admin/schools/pending">the admin dashboard</a>.</p>`,
            },
          });
        }
      } catch (err) {
        console.error("Failed to notify super admins:", err);
      }

      setCompleted(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
    setSubmitting(false);
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="text-5xl mb-2">🎉</div>
            <CardTitle className="text-2xl" style={{ color: "#0B4B39" }}>
              Registration submitted!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Thanks, {adminFirstName}! Your request for <strong>{schoolName}</strong> is being reviewed.
            </p>
            <p className="text-sm text-muted-foreground">
              We'll email you at <strong>{adminEmail}</strong> once your school has been approved.
            </p>
            <Button
              style={{ backgroundColor: "#0B4B39" }}
              className="text-white hover:opacity-90"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Karawhiua</p>
          <h1 className="text-2xl font-bold" style={{ color: "#0B4B39" }}>Register your school</h1>
          <p className="text-sm text-muted-foreground mt-1">Get your school set up on the platform</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">Step {step} of {totalSteps}</p>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "School Details"}
              {step === 2 && "Email Domains"}
              {step === 3 && "Houses / Whānau Groups"}
              {step === 4 && "Admin Account"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about your school."}
              {step === 2 && "Which email domains do your students use?"}
              {step === 3 && "Set up the houses for your school."}
              {step === 4 && "Create your admin account."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 — School details */}
            {step === 1 && (
              <>
                <div>
                  <Label htmlFor="schoolName">School name *</Label>
                  <Input
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. Te Kura o Karawhiua"
                  />
                </div>
                <div>
                  <Label>Region *</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>School type *</Label>
                  <Select value={schoolType} onValueChange={setSchoolType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {SCHOOL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 2 — Email domains */}
            {step === 2 && (
              <>
                <div>
                  <Label htmlFor="primaryDomain">School email domain *</Label>
                  <Input
                    id="primaryDomain"
                    value={primaryDomain}
                    onChange={(e) => setPrimaryDomain(e.target.value.toLowerCase().replace(/^@/, ""))}
                    placeholder="e.g. karawhiua.school.nz"
                  />
                  {checkingDomain && <p className="text-xs text-muted-foreground mt-1">Checking availability…</p>}
                  {!checkingDomain && domainAvailable === true && (
                    <p className="text-xs text-green-600 mt-1">✓ Domain available</p>
                  )}
                  {!checkingDomain && domainAvailable === false && (
                    <p className="text-xs text-destructive mt-1">This domain is already registered</p>
                  )}
                  {primaryDomain && PERSONAL_DOMAINS.includes(primaryDomain) && (
                    <p className="text-xs text-destructive mt-1">Use your school domain, not a personal email domain</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="secondaryDomain">Secondary domain (optional)</Label>
                  <Input
                    id="secondaryDomain"
                    value={secondaryDomain}
                    onChange={(e) => setSecondaryDomain(e.target.value.toLowerCase().replace(/^@/, ""))}
                    placeholder="e.g. student.karawhiua.school.nz"
                  />
                </div>
              </>
            )}

            {/* Step 3 — Houses */}
            {step === 3 && (
              <>
                <div>
                  <Label>Choose a template or customise</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {HOUSE_TEMPLATES.map((t) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => { setHouseTemplate(t.name); setCustomHouses([]); }}
                        className={`p-2 rounded-lg border-2 text-xs transition-all ${
                          houseTemplate === t.name
                            ? "border-[#0B4B39] bg-green-50"
                            : "border-border hover:border-[#0B4B39]/50"
                        }`}
                      >
                        <div className="flex gap-1 justify-center mb-1">
                          {t.houses.map((h) => (
                            <span key={h.name} className="w-4 h-4 rounded-full" style={{ background: h.color }} />
                          ))}
                        </div>
                        <p className="font-medium">{t.name}</p>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setHouseTemplate(null); setCustomHouses(HOUSE_TEMPLATES[0].houses.map((h) => ({ ...h }))); }}
                      className={`p-2 rounded-lg border-2 text-xs transition-all ${
                        houseTemplate === null && customHouses.length > 0
                          ? "border-[#0B4B39] bg-green-50"
                          : "border-border hover:border-[#0B4B39]/50"
                      }`}
                    >
                      <p className="text-lg mb-1">✏️</p>
                      <p className="font-medium">Custom</p>
                    </button>
                  </div>
                </div>

                {houseTemplate && (
                  <div className="space-y-2">
                    {HOUSE_TEMPLATES.find((t) => t.name === houseTemplate)?.houses.map((h, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                        <div className="w-8 h-8 rounded-lg" style={{ background: h.color }} />
                        <span className="text-sm font-medium">{h.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {houseTemplate === null && customHouses.length > 0 && (
                  <div className="space-y-2">
                    {customHouses.map((h, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Input
                          value={h.name}
                          onChange={(e) => {
                            const updated = [...customHouses];
                            updated[i] = { ...updated[i], name: e.target.value };
                            setCustomHouses(updated);
                          }}
                          placeholder="House name"
                          className="flex-1"
                        />
                        <Input
                          type="color"
                          value={h.color}
                          onChange={(e) => {
                            const updated = [...customHouses];
                            updated[i] = { ...updated[i], color: e.target.value };
                            setCustomHouses(updated);
                          }}
                          className="w-12 h-10 p-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 4 — Admin account */}
            {step === 4 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="adminFirstName">First name *</Label>
                    <Input id="adminFirstName" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="adminLastName">Last name *</Label>
                    <Input id="adminLastName" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="adminEmail">Work email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder={`you@${primaryDomain || "school.nz"}`}
                  />
                  {adminEmail && !adminEmail.includes(primaryDomain) && (
                    <p className="text-xs text-destructive mt-1">Must use your school domain (@{primaryDomain})</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="adminPassword">Password (8+ characters) *</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Create a strong password"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="agreeTerms" className="text-sm">
                    I confirm that I am authorised to register this school and agree to the terms of service.
                  </Label>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <div />
          )}
          {step < totalSteps ? (
            <Button
              style={{ backgroundColor: "#0B4B39" }}
              className="text-white hover:opacity-90"
              onClick={() => {
                if (step === 1 && validateStep1()) setStep(2);
                else if (step === 2 && validateStep2()) setStep(3);
                else if (step === 3 && validateStep3()) setStep(4);
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              style={{ backgroundColor: "#0B4B39" }}
              className="text-white hover:opacity-90"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit registration"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
