import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { listHousesBySchool, listSchools } from "@/lib/schools.functions";

type SearchParams = { redirect?: string };

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Karawhiua" },
      { name: "description", content: "Sign in or create an account for Karawhiua Virtual Sports Day." },
    ],
  }),
  component: AuthPage,
});

const YEAR_GROUPS = [
  "Year 0", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5",
  "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11",
  "Year 12", "Year 13", "Staff",
];

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  // If already authed, bounce away
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted && data.user) navigate({ to: search.redirect ?? "/dashboard", replace: true });
    });
    return () => {
      mounted = false;
    };
  }, [navigate, search.redirect]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-grey p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-brand-green-soft">Karawhiua</p>
          <h1 className="text-3xl font-bold text-brand-green">Virtual Sports Day</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sport Waikato's school competition</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or create an account to keep moving.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="pt-4">
                <SignInForm redirectTo={search.redirect ?? "/dashboard"} />
              </TabsContent>
              <TabsContent value="signup" className="pt-4">
                <SignUpForm redirectTo={search.redirect ?? "/dashboard"} />
              </TabsContent>
            </Tabs>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GoogleButton />

            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link to="/forgot-password" className="underline">Forgot your password?</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SignInForm({ redirectTo }: { redirectTo: string }) {
  const navigate = useNavigate();
  return (
    <Formik
      initialValues={{ email: "", password: "" }}
      validationSchema={Yup.object({
        email: Yup.string().email("Invalid email").required("Required"),
        password: Yup.string().min(6, "At least 6 characters").required("Required"),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        setSubmitting(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome back");
        navigate({ to: redirectTo, replace: true });
      }}
    >
      {({ values, handleChange, handleBlur, touched, errors, isSubmitting }) => (
        <Form className="space-y-3">
          <div>
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-green text-white hover:bg-brand-green-soft"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

type School = { id: string; name: string; code: string | null };
type House = { id: string; name: string; color: string | null };

function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const navigate = useNavigate();
  const fetchSchools = useServerFn(listSchools);
  const fetchHouses = useServerFn(listHousesBySchool);
  const [schools, setSchools] = useState<School[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchSchools()
      .then((rows) => {
        if (mounted) setSchools(rows as School[]);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load schools"))
      .finally(() => {
        if (mounted) setSchoolsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetchSchools]);

  return (
    <Formik
      initialValues={{
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        schoolId: "",
        houseId: "",
        yearGroup: "",
      }}
      validationSchema={Yup.object({
        email: Yup.string().email("Invalid email").required("Required"),
        password: Yup.string().min(8, "At least 8 characters").required("Required"),
        firstName: Yup.string().trim().required("Required"),
        lastName: Yup.string().trim().required("Required"),
        schoolId: Yup.string().uuid("Pick a school").required("Required"),
        houseId: Yup.string().uuid("Pick a house").required("Required"),
        yearGroup: Yup.string().required("Required"),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              first_name: values.firstName,
              last_name: values.lastName,
              school_id: values.schoolId,
              house_id: values.houseId,
              year_group: values.yearGroup,
            },
          },
        });

        if (error) {
          toast.error(error.message);
          setSubmitting(false);
          return;
        }

        // If we got an immediate session (email confirmation off), seed the users row
        if (data.user && data.session) {
          await supabase.from("users").upsert(
            {
              id: data.user.id,
              first_name: values.firstName,
              last_name: values.lastName,
              school_id: values.schoolId,
              house_id: values.houseId,
              year_group: values.yearGroup,
              role: "student",
              is_active: true,
            },
            { onConflict: "id" },
          );
          toast.success("Account created");
          navigate({ to: redirectTo, replace: true });
        } else {
          toast.success("Check your email to confirm your account");
        }
        setSubmitting(false);
      }}
    >
      {({ values, handleChange, handleBlur, setFieldValue, touched, errors, isSubmitting }) => (
        <Form className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="su-first">First name</Label>
              <Input
                id="su-first"
                name="firstName"
                value={values.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.firstName && errors.firstName && (
                <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="su-last">Last name</Label>
              <Input
                id="su-last"
                name="lastName"
                value={values.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.lastName && errors.lastName && (
                <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="su-email">Email</Label>
            <Input
              id="su-email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="su-password">Password</Label>
            <Input
              id="su-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <div>
            <Label>School</Label>
            <Select
              value={values.schoolId}
              onValueChange={async (v) => {
                setFieldValue("schoolId", v);
                setFieldValue("houseId", "");
                setHouses([]);
                try {
                  const rows = await fetchHouses({ data: { schoolId: v } });
                  setHouses(rows as House[]);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to load houses");
                }
              }}
              disabled={schoolsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={schoolsLoading ? "Loading schools…" : "Choose your school"} />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.schoolId && errors.schoolId && (
              <p className="mt-1 text-xs text-destructive">{errors.schoolId}</p>
            )}
          </div>

          <div>
            <Label>House</Label>
            <Select
              value={values.houseId}
              onValueChange={(v) => setFieldValue("houseId", v)}
              disabled={!values.schoolId || houses.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={values.schoolId ? "Choose your house" : "Pick a school first"} />
              </SelectTrigger>
              <SelectContent>
                {houses.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.houseId && errors.houseId && (
              <p className="mt-1 text-xs text-destructive">{errors.houseId}</p>
            )}
          </div>

          <div>
            <Label>Year group</Label>
            <Select value={values.yearGroup} onValueChange={(v) => setFieldValue("yearGroup", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your year group" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_GROUPS.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.yearGroup && errors.yearGroup && (
              <p className="mt-1 text-xs text-destructive">{errors.yearGroup}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-green text-white hover:bg-brand-green-soft"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }
  return (
    <Button type="button" variant="outline" className="w-full" onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
