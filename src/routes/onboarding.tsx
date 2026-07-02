import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
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
import { LOGOS } from "@/lib/logos";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { userId: data.user.id, email: data.user.email ?? "" };
  },
  component: OnboardingPage,
});

type School = {
  id: string;
  name: string;
  email_domain: string | null;
  secondary_email_domain: string | null;
};
type House = { id: string; name: string; color: string };

const YEAR_GROUPS = [
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
  "Year 13",
  "Staff",
];

function OnboardingPage() {
  const { userId, email } = Route.useRouteContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1 — School
  const [schools, setSchools] = useState<School[]>([]);
  const [matchedSchool, setMatchedSchool] = useState<School | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [loadingSchool, setLoadingSchool] = useState(true);

  // Step 2 — House
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);

  // Step 3 — About
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [className, setClassName] = useState("");

  // Step 4 — final
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const userDomain = email.split("@")[1]?.toLowerCase() || "";

  // On mount, try to auto-match school
  useEffect(() => {
    (async () => {
      setLoadingSchool(true);

      // Check sessionStorage for join code
      const joinCode = sessionStorage.getItem("join_code");
      if (joinCode) {
        const { data } = await supabase.rpc("lookup_school_by_join_code", {
          p_join_code: joinCode,
        });
        const rpcData = data as unknown as { id: string; name: string } | null;
        if (rpcData) {
          const { data: schoolData } = await supabase
            .from("schools")
            .select("id, name, email_domain, secondary_email_domain")
            .eq("id", rpcData.id)
            .maybeSingle();
          if (schoolData) {
            setMatchedSchool(schoolData);
            setSelectedSchool(schoolData);
            sessionStorage.removeItem("join_code");
            setLoadingSchool(false);
            return;
          }
        }
        sessionStorage.removeItem("join_code");
      }

      // Try domain match
      if (userDomain) {
        const { data } = await supabase
          .from("schools")
          .select("id, name, email_domain, secondary_email_domain")
          .eq("is_active", true)
          .or(`email_domain.eq.${userDomain},secondary_email_domain.eq.${userDomain}`)
          .maybeSingle();
        if (data) {
          setMatchedSchool(data);
          setSelectedSchool(data);
        }
      }

      const { data: allSchools } = await supabase
        .from("schools")
        .select("id, name, email_domain, secondary_email_domain")
        .eq("is_active", true)
        .order("name");
      setSchools(allSchools ?? []);
      setLoadingSchool(false);
    })();
  }, [userDomain]);

  // Live search
  useEffect(() => {
    if (matchedSchool) {
      setSearchResults([]);
      return;
    }
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      (schools as School[]).filter((s: School) => s.name.toLowerCase().includes(q)).slice(0, 6),
    );
  }, [searchQuery, schools, matchedSchool]);

  // Load houses when school changes
  useEffect(() => {
    if (!selectedSchool) {
      setHouses([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("houses")
        .select("id, name, color")
        .eq("school_id", selectedSchool.id)
        .order("name");
      setHouses((data ?? []) as House[]);
    })();
  }, [selectedSchool]);

  const validateStep1 = () => {
    if (!selectedSchool) {
      toast.error("Please select your school");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!selectedHouse) {
      toast.error("Please select your house");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!firstName.trim()) {
      toast.error("Please enter your first name");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Please enter your last name");
      return false;
    }
    if (!yearGroup) {
      toast.error("Please select your year group");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSubmitting(true);

    const { error } = await supabase.from("users").upsert({
      id: userId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: email.split("@")[0],
      school_id: selectedSchool!.id,
      house_id: selectedHouse,
      year_group: yearGroup,
      class: className || null,
      role: "student",
      is_admin: false,
      is_active: true,
      is_public: true,
    });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Send welcome email (best-effort)
    const houseName = (houses as House[]).find((h) => h.id === selectedHouse)?.name || "";
    try {
      const { sendEmail } = await import("@/lib/sendEmail");
      const { studentWelcome } = await import("@/emails/index");
      const houseColour = (houses as House[]).find((h) => h.name === houseName)?.color || "#1B5E4B";
      const { subject, html } = studentWelcome(
        firstName.trim(),
        selectedSchool!.name,
        houseName,
        houseColour,
      );
      await sendEmail({ data: { to: email, subject, html } });
    } catch (err) {
      console.error("Failed to send welcome email:", err);
    }

    setCompleted(true);
    setSubmitting(false);
  };

  if (completed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="text-5xl mb-2">🎉</div>
            <CardTitle className="text-2xl" style={{ color: "#1B5E4B" }}>
              You're all set!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Welcome to <strong>{selectedSchool?.name}</strong>
              {selectedHouse ? (
                <>
                  {" "}
                  in{" "}
                  <strong>{(houses as House[]).find((h) => h.id === selectedHouse)?.name}</strong>
                </>
              ) : (
                ""
              )}
              !
            </p>
            <Button
              style={{ backgroundColor: "#1B5E4B" }}
              className="text-white hover:opacity-90"
              onClick={() => navigate({ to: "/dashboard", replace: true })}
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
            Set up your profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Let's get you started</p>
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
              {step === 1 && "Find Your School"}
              {step === 2 && "Choose Your House"}
              {step === 3 && "About You"}
              {step === 4 && "Confirm"}
            </CardTitle>
            <CardDescription>
              {step === 1 && (matchedSchool ? "We found your school!" : "Search for your school.")}
              {step === 2 && "Select your house or whānau group."}
              {step === 3 && "Tell us a bit about yourself."}
              {step === 4 && "Review your details before we save them."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 — Find School */}
            {step === 1 && (
              <>
                {loadingSchool ? (
                  <p className="text-muted-foreground">Loading schools…</p>
                ) : matchedSchool ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl mb-2">✓</p>
                    <p className="font-semibold text-green-800">{matchedSchool.name}</p>
                    <p className="text-sm text-green-600 mt-1">
                      Automatically matched via your email or join link
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setMatchedSchool(null);
                        setSelectedSchool(null);
                      }}
                    >
                      Choose a different school
                    </Button>
                  </div>
                ) : (
                  <>
                    {schools.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-3">
                          No active schools found. If your school isn't registered yet, ask them to
                          sign up first.
                        </p>
                        <Button asChild variant="outline">
                          <Link to="/register-school">Register your school</Link>
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="schoolSearch">Search for your school</Label>
                        <Input
                          id="schoolSearch"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Type your school name…"
                        />
                        {searchResults.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {searchResults.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSchool(s);
                                }}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                  selectedSchool?.id === s.id
                                    ? "border-[#1B5E4B] bg-green-50"
                                    : "border-border hover:border-[#1B5E4B]/50"
                                }`}
                              >
                                <p className="font-medium">{s.name}</p>
                              </button>
                            ))}
                          </div>
                        )}
                        {searchQuery.length >= 2 && searchResults.length === 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            No schools found.{" "}
                            <Link
                              to="/register-school"
                              className="underline"
                              style={{ color: "#1B5E4B" }}
                            >
                              Register your school
                            </Link>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Step 2 — Choose House */}
            {step === 2 && (
              <>
                {houses.length === 0 ? (
                  <p className="text-muted-foreground">No houses found for this school.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(houses as House[]).map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setSelectedHouse(h.id)}
                        className={`rounded-xl overflow-hidden border-2 transition-all ${
                          selectedHouse === h.id
                            ? "border-[#1B5E4B] shadow-md scale-[1.02]"
                            : "border-border hover:border-[#1B5E4B]/50"
                        }`}
                      >
                        <div className="h-24" style={{ background: h.color }} />
                        <div className="p-3 text-center">
                          <p className="font-semibold text-sm">{h.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 3 — About You */}
            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Year group *</Label>
                  <Select value={yearGroup} onValueChange={setYearGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year group" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_GROUPS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="class">Class (optional)</Label>
                  <Input
                    id="class"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g. 10B or Room 4"
                  />
                </div>
              </>
            )}

            {/* Step 4 — Confirm */}
            {step === 4 && (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">
                      {firstName} {lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">School</span>
                    <span className="font-medium">{selectedSchool?.name}</span>
                  </div>
                  {selectedHouse && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">House</span>
                      <span className="font-medium flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{
                            background: (houses as House[]).find((h) => h.id === selectedHouse)
                              ?.color,
                          }}
                        />
                        {(houses as House[]).find((h) => h.id === selectedHouse)?.name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year group</span>
                    <span className="font-medium">{yearGroup}</span>
                  </div>
                  {className && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class</span>
                      <span className="font-medium">{className}</span>
                    </div>
                  )}
                </div>
              </div>
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
              {submitting ? "Saving…" : "Let's go!"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
