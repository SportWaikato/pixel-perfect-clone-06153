
import { useState } from 'react';
import { Formik, Form, FormikHelpers } from 'formik';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { forgotPasswordSchema } from '@/models/forms/schemas/authSchemas';
import { AuthService } from '@/models/auth/services/AuthService';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { FormikInputField } from '@/modules/common/components/Formik';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';

type ForgotPasswordValues = { email: string };

const ForgotPasswordForm = () => {
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (values: ForgotPasswordValues, { setSubmitting }: FormikHelpers<ForgotPasswordValues>) => {
    try {
      const supabase = createSupabaseClient();
      const authService = new AuthService(supabase);

      await authService.resetPasswordForEmail(values.email);

      setEmailSent(true);
      toast.success('Password reset link has been sent to your email!');
    } catch (error) {
      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('For security purposes')) {
        toast.error('Please wait a moment before requesting another reset email. This is a security measure to prevent abuse.');
      } else {
        notifyAboutError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
        <p className="text-sm text-gray-600">
          We&apos;ve sent a password reset link to your email address.
          Please check your inbox and follow the instructions to reset your password.
        </p>
        <p className="text-xs text-gray-500">
          Didn&apos;t receive the email? Check your spam folder or try again.
        </p>
        <Button
          onClick={() => setEmailSent(false)}
          variant="outline"
          className="w-full"
        >
          Send another link
        </Button>
      </div>
    );
  }

  return (
    <Formik
      initialValues={{ email: '' }}
      validationSchema={forgotPasswordSchema}
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

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default ForgotPasswordForm;