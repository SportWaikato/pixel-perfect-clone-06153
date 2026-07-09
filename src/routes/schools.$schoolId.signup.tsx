import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import SchoolSpecificSignUpForm from "@/modules/auth/components/SchoolSpecificSignUpForm";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import { getSchoolForSignup } from "@/lib/schools.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/schools/$schoolId/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join your school — Karawhiua" },
      {
        name: "description",
        content: "Create your Karawhiua account and join your school's team.",
      },
    ],
  }),
  component: SchoolSignUpPage,
});

function SchoolSignUpPage() {
  const { schoolId } = Route.useParams();
  const [school, setSchool] = useState<SchoolInterface | null | undefined>(undefined);

  useEffect(() => {
    getSchoolForSignup({ data: { schoolId } })
      .then((s) => setSchool((s as SchoolInterface) ?? null))
      .catch(() => setSchool(null));
  }, [schoolId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-grey p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <img
            src="/KarawhiuaWordmark.png"
            alt="Karawhiua — Go For It!"
            className="mx-auto h-12 w-auto"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Sport Waikato&apos;s school movement challenge
          </p>
        </div>

        <Card>
          {school === undefined && (
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading your school…
            </CardContent>
          )}

          {school === null && (
            <>
              <CardHeader>
                <CardTitle>School not found</CardTitle>
                <CardDescription>
                  This sign-up link isn't valid or the school isn't active yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Double-check the link from your school, or{" "}
                  <Link to="/auth" className="text-primary underline">
                    sign in here
                  </Link>{" "}
                  if you already have an account.
                </p>
              </CardContent>
            </>
          )}

          {school && (
            <>
              <CardHeader>
                <CardTitle>Create your account</CardTitle>
                <CardDescription>Join {school.name} and start earning points.</CardDescription>
              </CardHeader>
              <CardContent>
                <SchoolSpecificSignUpForm school={school} />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
