import { createFileRoute, Link } from "@tanstack/react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Forgot password — Karawhiua" },
      { name: "description", content: "Reset your Karawhiua account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>We'll email you a link to set a new password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Formik
              initialValues={{ email: "" }}
              validationSchema={Yup.object({
                email: Yup.string().email("Invalid email").required("Required"),
              })}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                setSubmitting(false);
                if (error) {
                  toast.error(error.message);
                  return;
                }
                toast.success("If that email exists, a reset link is on its way.");
                resetForm();
              }}
            >
              {({ values, handleChange, handleBlur, touched, errors, isSubmitting }) => (
                <Form className="space-y-3">
                  <div>
                    <Label htmlFor="fp-email">Email</Label>
                    <Input
                      id="fp-email"
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
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ backgroundColor: "#0A4B39", color: "#fff" }} className="w-full" 
                  >
                    {isSubmitting ? "Sending…" : "Send reset link"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    <Link to="/auth" className="underline">Back to sign in</Link>
                  </p>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
