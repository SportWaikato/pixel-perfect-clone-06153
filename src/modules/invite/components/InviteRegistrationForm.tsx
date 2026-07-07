import { Formik, Form } from "formik";
import { inviteRegistrationSchema } from "@/models/forms/schemas/authSchemas";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Input } from "@/modules/application/components/DesignSystem/ui/input";
import { Label } from "@/modules/application/components/DesignSystem/ui/label";
import { FormikInputField } from "@/modules/common/components/Formik";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { acceptSuperAdminInvite } from "@/lib/invites.functions";

interface InviteRegistrationFormProps {
  email: string;
  token: string;
}

const InviteRegistrationForm = ({ email, token }: InviteRegistrationFormProps) => {
  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const supabase = createSupabaseClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: values.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user account");

      await acceptSuperAdminInvite({
        data: {
          token,
          username: values.username,
          firstName: values.firstName,
          lastName: values.lastName,
        },
      });

      toast.success("Account created! Welcome.");
      window.location.href = "/admin";
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        confirmPassword: "",
      }}
      validationSchema={inviteRegistrationSchema}
      onSubmit={handleSubmit}
      validateOnBlur={false}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Your account will be created with this email address.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormikInputField name="firstName" label="First Name" placeholder="Jane" />
            <FormikInputField name="lastName" label="Last Name" placeholder="Smith" />
          </div>

          <FormikInputField name="username" label="Username" placeholder="jane.smith" />

          <FormikInputField
            name="password"
            label="Password"
            type="password"
            placeholder="Enter password"
          />

          <FormikInputField
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm password"
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            style={{ backgroundColor: "#1B5E4B" }}
          >
            {isSubmitting ? "Creating Account…" : "Create Account"}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default InviteRegistrationForm;
