import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { listSchools } from "@/lib/schools.functions";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { userId: data.user.id, email: data.user.email ?? "" };
  },
  component: OnboardingPage,
});

type School = { id: string; name: string };
type House = { id: string; name: string };

function OnboardingPage() {
  const { userId, email } = Route.useRouteContext();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [houseId, setHouseId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSchools().then((rows: School[]) => setSchools(rows)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!schoolId) return setHouses([]);
    supabase.from("houses").select("id, name").eq("school_id", schoolId).order("name")
      .then(({ data }) => setHouses((data ?? []) as House[]));
    setHouseId("");
  }, [schoolId]);

  async function handleSubmit() {
    if (!schoolId || !firstName || !lastName) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("users").upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      username: email.split("@")[0],
      school_id: schoolId,
      house_id: houseId || null,
      year_group: yearGroup || null,
      role: "student",
      is_admin: false,
      is_active: true,
      is_public: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to Karawhiua!");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set up your profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div><Label>Last name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
          <div>
            <Label>School</Label>
            <Select value={schoolId} onValueChange={setSchoolId}>
              <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
              <SelectContent>{schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {houses.length > 0 && (
            <div>
              <Label>House (optional)</Label>
              <Select value={houseId} onValueChange={setHouseId}>
                <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
                <SelectContent>{houses.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Year group (optional)</Label>
            <Input value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} placeholder="e.g. Year 9" />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
