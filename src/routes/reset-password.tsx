import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set new password — Karawhiua" },
      { name: "description", content: "Set a new password for your Karawhiua account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link from Supabase puts a token in the URL hash;
    // supabase-js handles it automatically when the page loads.
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check existing session in case the event has already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>
              {ready ? "Choose a new password to finish resetting." : "Verifying your reset link…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Formik
              initialValues={{ password: "", confirm: "" }}
              validationSchema={Yup.object({
                password: Yup.string().min(8, "At least 8 characters").required("Required"),
                confirm: Yup.string()
                  .oneOf([Yup.ref("password")], "Passwords don't match")
                  .required("Required"),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                const { error } = await supabase.auth.updateUser({ password: values.password });
                setSubmitting(false);
                if (error) {
                  toast.error(error.message);
                  return;
                }
                toast.success("Password updated");
                navigate({ to: "/dashboard", replace: true });
              }}
            >
              {({ values, handleChange, handleBlur, touched, errors, isSubmitting }) => (
                <Form className="space-y-3">
                  <div>
                    <Label htmlFor="rp-password">New password</Label>
                    <Input
                      id="rp-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={!ready}
                    />
                    {touched.password && errors.password && (
                      <p className="mt-1 text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="rp-confirm">Confirm password</Label>
                    <Input
                      id="rp-confirm"
                      name="confirm"
                      type="password"
                      autoComplete="new-password"
                      value={values.confirm}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={!ready}
                    />
                    {touched.confirm && errors.confirm && (
                      <p className="mt-1 text-xs text-destructive">{errors.confirm}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !ready}
                    className="w-full bg-brand-green text-white hover:bg-brand-green-soft"
                  >
                    {isSubmitting ? "Updating…" : "Update password"}
                  </Button>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
