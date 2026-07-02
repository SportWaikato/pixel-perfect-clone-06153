import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { checkDomainAvailable } from "@/lib/registration.functions";
import { LOGOS } from "@/lib/logos";

const REGIONS = [
  "Waikato",
  "Auckland",
  "Bay of Plenty",
  "Taranaki",
  "Manawatū-Whanganui",
  "Wellington",
  "Canterbury",
  "Otago",
  "Southland",
  "Northland",
];

const SCHOOL_TYPES = ["Primary", "Intermediate", "Secondary", "Full Primary", "Composite"];

const DEFAULT_HOUSES = [
  { name: "", color: "#D103D1" },
  { name: "", color: "#1B5E4B" },
  { name: "", color: "#118061" },
  { name: "", color: "#10EFEB" },
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
  const [customHouses, setCustomHouses] = useState<{ name: string; color: string }[]>(
    DEFAULT_HOUSES.map((h) => ({ ...h })),
  );

  // Step 4 — Admin account
  const [authMethod, setAuthMethod] = useState<"google" | "email" | null>(null);
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [googleProcessing, setGoogleProcessing] = useState(false);

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
      .then((res) => {
        setDomainAvailable(res.available);
        setCheckingDomain(false);
      })
      .catch(() => {
        setDomainAvailable(null);
        setCheckingDomain(false);
      });
  }, [primaryDomain]);

  const PERSONAL_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "live.com",
    "protonmail.com",
  ];

  // Restore form state AND check for Google OAuth return on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("register_school_state");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.schoolName) setSchoolName(state.schoolName);
        if (state.region) setRegion(state.region);
        if (state.schoolType) setSchoolType(state.schoolType);
        if (state.primaryDomain) setPrimaryDomain(state.primaryDomain);
        if (state.secondaryDomain) setSecondaryDomain(state.secondaryDomain);
        if (state.houses) setCustomHouses(state.houses);
        if (state.step) setStep(state.step);
      } catch {
        sessionStorage.removeItem("register_school_state");
      }
    }

    // After restoring state, check for existing Google session on mount (OAuth redirect flow)
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user && data.user.email) {
        const email = data.user.email;
        const domain = email.split("@")[1]?.toLowerCase();
        const restoredDomain = sessionStorage.getItem("register_school_state")
          ? JSON.parse(sessionStorage.getItem("register_school_state")!).primaryDomain
          : "";

        if (domain && restoredDomain && domain === restoredDomain) {
          setAdminEmail(email);
          setAdminFirstName(data.user.user_metadata?.full_name?.split(" ")[0] ?? "");
          setAdminLastName(data.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ?? "");
          setAuthMethod("google");
          setStep(4);
        }
      }
    })();
  }, []);

  const saveFormState = () => {
    sessionStorage.setItem(
      "register_school_state",
      JSON.stringify({
        schoolName,
        region,
        schoolType,
        primaryDomain,
        secondaryDomain,
        houses: customHouses,
        step: 4,
      }),
    );
  };

  const validateStep1 = () => {
    if (!schoolName.trim()) {
      toast.error("Enter your school name");
      return false;
    }
    if (!region) {
      toast.error("Select your school's region");
      return false;
    }
    if (!schoolType) {
      toast.error("Select your school type");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!primaryDomain) {
      toast.error("Enter your school email domain");
      return false;
    }
    if (PERSONAL_DOMAINS.includes(primaryDomain)) {
      toast.error("Use your school domain, not a personal email domain");
      return false;
    }
    if (domainAvailable === false) {
      toast.error("This domain is already registered to another school");
      return false;
    }
    if (secondaryDomain && PERSONAL_DOMAINS.includes(secondaryDomain)) {
      toast.error("Secondary domain cannot be a personal domain");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (customHouses.length < 2) {
      toast.error("Add at least 2 houses");
      return false;
    }
    if (customHouses.some((h) => !h.name.trim())) {
      toast.error("Every house needs a name");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!authMethod) {
      toast.error("Choose a sign-up method");
      return false;
    }
    if (authMethod === "google" && !adminEmail) {
      toast.error("Sign in with Google first");
      return false;
    }
    if (authMethod === "email") {
      if (!adminFirstName.trim()) {
        toast.error("Enter your first name");
        return false;
      }
      if (!adminLastName.trim()) {
        toast.error("Enter your last name");
        return false;
      }
      if (!adminEmail) {
        toast.error("Enter your email address");
        return false;
      }
      if (!adminEmail.includes(primaryDomain)) {
        toast.error("Your email must use the school domain");
        return false;
      }
      if (adminPassword.length < 8) {
        toast.error("Password must be at least 8 characters");
        return false;
      }
    } else {
      if (!adminFirstName.trim()) {
        toast.error("Enter your first name");
        return false;
      }
      if (!adminLastName.trim()) {
        toast.error("Enter your last name");
        return false;
      }
    }
    if (!agreeTerms) {
      toast.error("You must agree to the terms");
      return false;
    }
    return true;
  };

  const handleGoogleSignIn = useCallback(async () => {
    if (!primaryDomain) {
      toast.error("Please complete step 2 (email domain) first");
      return;
    }
    setGoogleProcessing(true);
    saveFormState();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/register-school",
      },
    });

    if (error) {
      toast.error(error.message);
      setGoogleProcessing(false);
      return;
    }

    setGoogleProcessing(false);
  }, [primaryDomain, schoolName, region, schoolType, secondaryDomain, customHouses]);

  // Listen for Google OAuth return (popup or redirect)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const user = session.user;
        const email = user.email ?? "";
        const domain = email.split("@")[1]?.toLowerCase();
        const savedDomain = (() => {
          try {
            const saved = sessionStorage.getItem("register_school_state");
            return saved ? JSON.parse(saved).primaryDomain : "";
          } catch {
            return "";
          }
        })();
        const expectedDomain = primaryDomain || savedDomain;

        if (!domain || domain !== expectedDomain) {
          await supabase.auth.signOut();
          toast.error(
            `Your Google account email must match your school domain (@${expectedDomain}). Please use your school Google account or sign up with email below.`,
          );
          return;
        }

        setAdminEmail(email);
        setAdminFirstName(user.user_metadata?.full_name?.split(" ")[0] ?? "");
        setAdminLastName(user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ?? "");
        setAuthMethod("google");
        toast.success("Signed in with Google!");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [primaryDomain]);

  const handleSubmit = async () => {
    if (!validateStep4()) return;
    setSubmitting(true);

    const houses = customHouses;

    try {
      let userId: string;

      if (authMethod === "google") {
        const { data: user, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user.user) throw new Error("Not authenticated with Google");
        userId = user.user.id;
      } else {
        // Create auth user via email/password
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
        userId = signUpData.user.id;
      }

      // Insert school
      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: schoolName.trim(),
          code: schoolName.trim().slice(0, 6).toUpperCase().replace(/\s/g, ""),
          region,
          school_type: schoolType,
          email_domain: primaryDomain,
          secondary_email_domain: secondaryDomain || null,
          registration_method: "self",
        } as any)
        .select("id")
        .single();

      if (schoolError) {
        // User cleanup is handled server-side by the registration function.
        // Browser client does not have admin privileges for auth.admin operations.
        throw schoolError;
      }

      // Insert houses
      const { error: housesError } = await supabase.from("houses").insert(
        houses
          .filter((h) => h.name.trim())
          .map((h) => ({
            school_id: school.id,
            name: h.name.trim(),
            color: h.color,
          })),
      );

      if (housesError) {
        try {
          await supabase.from("schools").delete().eq("id", school.id);
        } catch {
          /* best-effort cleanup */
        }
        // User/auth cleanup is handled server-side by the registration function.
        // Browser client does not have admin privileges for auth.admin operations.
        throw housesError;
      }

      // Insert user
      const { error: userError } = await supabase.from("users").insert({
        id: userId,
        first_name: adminFirstName.trim(),
        last_name: adminLastName.trim(),
        username: adminEmail.split("@")[0],
        school_id: school.id,
        role: "school_admin",
        is_active: true,
      });

      if (userError) throw userError;

      // Send confirmation email (best-effort)
      try {
        const { sendEmail } = await import("@/lib/sendEmail");
        const { schoolRegistrationPending } = await import("@/emails/index");
        const houseNamesJoined = customHouses
          .filter((h) => h.name.trim())
          .map((h) => h.name.trim())
          .join(", ");
        const { subject, html } = schoolRegistrationPending(
          adminFirstName.trim(),
          schoolName.trim(),
          region,
          primaryDomain,
          houseNamesJoined,
        );
        await sendEmail({ data: { to: adminEmail, subject, html } });
      } catch (err) {
        console.error("Failed to send confirmation email:", err);
      }

      // Super-admin notification is handled server-side (users table has no email column).

      sessionStorage.removeItem("register_school_state");
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
            <CardTitle className="text-2xl" style={{ color: "#1B5E4B" }}>
              Registration submitted!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Thanks, {adminFirstName}! Your request for <strong>{schoolName}</strong> is being
              reviewed.
            </p>
            <p className="text-sm text-muted-foreground">
              We'll email you at <strong>{adminEmail}</strong> once your school has been approved.
            </p>
            <Button
              style={{ backgroundColor: "#1B5E4B" }}
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
          <img
            src={LOGOS.WHITE_ON_GREEN}
            alt="Karawhiua"
            className="mx-auto mb-2"
            style={{ width: "140px", height: "auto" }}
          />
          <h1 className="text-2xl font-bold" style={{ color: "#1B5E4B" }}>
            Register your school
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get your school set up on the platform
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Step {step} of {totalSteps}
          </p>
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
              {step === 3 && "Name your school's houses and choose a colour for each one."}
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>School type *</Label>
                  <Select value={schoolType} onValueChange={setSchoolType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
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
                    onChange={(e) =>
                      setPrimaryDomain(e.target.value.toLowerCase().replace(/^@/, ""))
                    }
                    placeholder="e.g. karawhiua.school.nz"
                  />
                  {checkingDomain && (
                    <p className="text-xs text-muted-foreground mt-1">Checking availability…</p>
                  )}
                  {!checkingDomain && domainAvailable === true && (
                    <p className="text-xs text-green-600 mt-1">✓ Domain available</p>
                  )}
                  {!checkingDomain && domainAvailable === false && (
                    <p className="text-xs text-destructive mt-1">
                      This domain is already registered
                    </p>
                  )}
                  {primaryDomain && PERSONAL_DOMAINS.includes(primaryDomain) && (
                    <p className="text-xs text-destructive mt-1">
                      Use your school domain, not a personal email domain
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="secondaryDomain">Secondary domain (optional)</Label>
                  <Input
                    id="secondaryDomain"
                    value={secondaryDomain}
                    onChange={(e) =>
                      setSecondaryDomain(e.target.value.toLowerCase().replace(/^@/, ""))
                    }
                    placeholder="e.g. student.karawhiua.school.nz"
                  />
                </div>
              </>
            )}

            {/* Step 3 — Houses */}
            {step === 3 && (
              <>
                <div className="space-y-3">
                  {customHouses.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-lg border cursor-pointer"
                          style={{ backgroundColor: h.color }}
                          onClick={() => {
                            const input = document.getElementById(
                              `house-color-${i}`,
                            ) as HTMLInputElement;
                            input?.click();
                          }}
                        />
                        <Input
                          id={`house-color-${i}`}
                          type="color"
                          value={h.color}
                          onChange={(e) => {
                            const updated = [...customHouses];
                            updated[i] = { ...updated[i], color: e.target.value };
                            setCustomHouses(updated);
                          }}
                          className="sr-only"
                        />
                      </div>
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
                      {customHouses.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = customHouses.filter((_, idx) => idx !== i);
                            setCustomHouses(updated);
                          }}
                          className="text-destructive hover:text-destructive/80 text-lg p-1"
                          title="Remove house"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {customHouses.length < 8 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      setCustomHouses([...customHouses, { name: "", color: "#6B7280" }])
                    }
                  >
                    + Add another house
                  </Button>
                )}
              </>
            )}

            {/* Step 4 — Admin account */}
            {step === 4 && (
              <>
                {/* Google sign-in button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 h-11"
                  onClick={handleGoogleSignIn}
                  disabled={googleProcessing || authMethod === "google"}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {authMethod === "google"
                    ? "✓ Signed in with Google"
                    : googleProcessing
                      ? "Connecting…"
                      : "Continue with Google"}
                </Button>

                {/* Divider */}
                {authMethod !== "google" && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        or sign up with email
                      </span>
                    </div>
                  </div>
                )}

                {authMethod === "google" && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Signed in as <strong>{adminEmail}</strong>
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="adminFirstName">First name *</Label>
                        <Input
                          id="adminFirstName"
                          value={adminFirstName}
                          onChange={(e) => setAdminFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminLastName">Last name *</Label>
                        <Input
                          id="adminLastName"
                          value={adminLastName}
                          onChange={(e) => setAdminLastName(e.target.value)}
                        />
                      </div>
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
                        I confirm that I am authorised to register this school and agree to the
                        terms of service.
                      </Label>
                    </div>
                  </div>
                )}

                {authMethod !== "google" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="adminFirstName">First name *</Label>
                        <Input
                          id="adminFirstName"
                          value={adminFirstName}
                          onChange={(e) => setAdminFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminLastName">Last name *</Label>
                        <Input
                          id="adminLastName"
                          value={adminLastName}
                          onChange={(e) => setAdminLastName(e.target.value)}
                        />
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
                        <p className="text-xs text-destructive mt-1">
                          Must use your school domain (@{primaryDomain})
                        </p>
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
                        I confirm that I am authorised to register this school and agree to the
                        terms of service.
                      </Label>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < totalSteps ? (
            <Button
              style={{ backgroundColor: "#1B5E4B" }}
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
              style={{ backgroundColor: "#1B5E4B" }}
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
