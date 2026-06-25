'use client';

import { Formik, Form, FormikHelpers } from 'formik';
import { useRouter } from 'next/navigation';
import { resetPasswordSchema } from '@/models/forms/schemas/authSchemas';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { AuthService } from '@/models/auth/services/AuthService';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { FormikInputField } from '@/modules/common/components/Formik';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';

type ResetPasswordValues = { password: string; confirmPassword: string };

const ResetPasswordForm = () => {
  const router = useRouter();

  const handleSubmit = async (values: ResetPasswordValues, { setSubmitting }: FormikHelpers<ResetPasswordValues>) => {
    try {
      const supabase = createSupabaseClient();
      const authService = new AuthService(supabase);

      await authService.updatePassword(values.password);

      toast.success('Password has been reset successfully!');
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        password: '',
        confirmPassword: '',
      }}
      validationSchema={resetPasswordSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-4">
          <FormikInputField
            name="password"
            label="New Password"
            type="password"
            placeholder="Enter your new password"
          />

          <FormikInputField
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm your new password"
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default ResetPasswordForm;