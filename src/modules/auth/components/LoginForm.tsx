import { Formik, Form, FormikHelpers } from "formik";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { UserService } from "@/models/users/services/UserService";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { FormikInputField } from "@/modules/common/components/Formik";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { getHomePath, UserRole } from "@/modules/auth/utils/roleUtils";
import { loginSchema } from "@/models/forms/schemas/authSchemas";

type LoginValues = { email: string; password: string };

const ROUTES_BY_ROLE: Record<string, string[]> = {
  student: ["/dashboard", "/activities", "/challenges", "/leaderboard", "/korero"],
  school_admin: ["/school", "/dashboard", "/school/users", "/school/events", "/leaderboard"],
  super_admin: [
    "/admin",
    "/admin/schools",
    "/admin/users",
    "/admin/badges",
    "/admin/events",
    "/leaderboard",
    "/admin/media",
  ],
};

const LoginForm = () => {
  const router = useRouter();
  const navigate = useNavigate();

  const redirectByRole = (role: UserRole | undefined) => {
    navigate({ to: getHomePath(role) });
    router.invalidate();
    const routes = ROUTES_BY_ROLE[role ?? "student"] ?? ROUTES_BY_ROLE.student;
    routes.forEach((path) => router.preloadRoute({ to: path }));
  };

  const handleSubmit = async (
    values: LoginValues,
    { setSubmitting }: FormikHelpers<LoginValues>,
  ) => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      const userService = new UserService(supabase);
      const role = await userService.getUserRoleById(data.user!.id);

      toast.success("Logged in successfully!");
      redirectByRole(role as UserRole | undefined);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        email: "",
        password: "",
      }}
      validationSchema={loginSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-4">
          <FormikInputField
            name="email"
            label="Email"
            type="email"
            placeholder="john.doe@school.edu"
          />

          <FormikInputField
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
          />

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default LoginForm;
