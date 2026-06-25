'use client';

import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import { useRouter } from 'next/navigation';
import { createSchoolSpecificSignUpSchema } from '@/models/forms/schemas/authSchemas';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { UserService } from '@/models/users/services/UserService';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { HouseInterface } from '@/models/houses/interfaces/HouseInterface';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { SelectItem, Select, SelectContent, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';
import { Label } from '@/modules/application/components/DesignSystem/ui/label';
import { FormikInputField, FormikSelectField } from '@/modules/common/components/Formik';
import { YEAR_GROUPS } from '@/models/application/constants/applicationConstants';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { isEmailAllowedResult } from '@/models/allowed-emails/utils/isEmailAllowed';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/modules/common/utils';
import Link from 'next/link';
import { getHousesBySchool } from '@/modules/auth/actions/getHousesBySchool';

interface SchoolSpecificSignUpFormProps {
  school: SchoolInterface;
}

type SchoolSignUpValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  house: string;
  yearGroup: string;
  class: string;
  password: string;
  confirmPassword: string;
};

const SchoolSpecificSignUpForm = ({ school }: SchoolSpecificSignUpFormProps) => {
  const [houses, setHouses] = useState<HouseInterface[]>([]);
  const [loadingHouses, setLoadingHouses] = useState(true);
  const router = useRouter();

  const validationSchema = useMemo(() => createSchoolSpecificSignUpSchema(school), [school]);

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const houseList = await getHousesBySchool(school.id);
        setHouses(houseList);
      } catch (error) {
        notifyAboutError(error);
        toast.error('Failed to load houses for this school');
      } finally {
        setLoadingHouses(false);
      }
    };

    fetchHouses();
  }, [school.id]);

  const handleSubmit = async (values: SchoolSignUpValues, { setSubmitting, setFieldError }: FormikHelpers<SchoolSignUpValues>) => {
    try {
      const supabase = createSupabaseClient();

      const userService = new UserService(supabase);
      if (await userService.isUsernameTaken(values.username)) {
        setFieldError('username', 'Username is already taken');
        return;
      }

      const { data: isAllowed } = await supabase.rpc('is_email_allowed', {
        p_school_id: school.id,
        p_email: values.email,
      });
      if (!isEmailAllowedResult(isAllowed)) {
        throw new Error('This email address is not on the approved list for this school. Please contact your school administrator.');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      await userService.create({
        id: authData.user.id,
        username: values.username,
        first_name: values.firstName,
        last_name: values.lastName,
        school_id: school.id,
        house_id: values.house,
        year_group: values.yearGroup,
        class: values.class || undefined,
        is_admin: false,
        is_public: true,
        total_kilometers: 0,
        role: 'student',
      });

      toast.success(`Welcome to ${school.name}!`);
      router.push('/auth/login');
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        house: '',
        yearGroup: '',
        class: '',
        password: '',
        confirmPassword: '',
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className="space-y-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium text-green-800">Joining: {school.name}</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              You&apos;ll be part of the {school.name} community
            </p>
          </div>

          <div className="space-y-1">
            <FormikInputField
              name="email"
              label="Email"
              type="email"
              placeholder="john.doe@school.edu"
            />
            {school.email_domain && (
              <p className="text-xs text-muted-foreground">
                Must use your school email: {school.email_domain.split(',').map(d => '@' + d.trim()).join(' or ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="house">House/Team</Label>
            <Field name="house">
              {({ field, form, meta }: any) => (
                <>
                  <Select
                    value={field.value}
                    onValueChange={(value) => form.setFieldValue('house', value)}
                    disabled={loadingHouses}
                  >
                    <SelectTrigger
                      className={cn(
                        'w-full',
                        meta.touched && meta.error ? 'border-red-500' : '',
                        loadingHouses && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      <SelectValue
                        placeholder={loadingHouses ? 'Loading houses...' : 'Select your house'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {houses.map((house) => (
                        <SelectItem key={house.id} value={house.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: house.color }}
                            ></div>
                            {house.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ErrorMessage name="house" component="div" className="text-red-500 text-sm" />
                  {!loadingHouses && houses.length === 0 && (
                    <p className="text-red-500 text-sm">
                      This school hasn&apos;t set up their houses yet. Please contact your school administrator.
                    </p>
                  )}
                </>
              )}
            </Field>
          </div>

          <FormikSelectField name="yearGroup" label="Year Group" placeholder="Select your year group">
            {YEAR_GROUPS.map((yg) => (
              <SelectItem key={yg} value={yg}>{yg}</SelectItem>
            ))}
          </FormikSelectField>

          <FormikInputField name="class" label="Class (optional)" placeholder="e.g. 10B" />

          <div className="grid grid-cols-2 gap-4">
            <FormikInputField
              name="firstName"
              label="First Name"
              placeholder="John"
            />
            <FormikInputField
              name="lastName"
              label="Last Name"
              placeholder="Doe"
            />
          </div>

          <FormikInputField
            name="username"
            label="Username"
            placeholder="john.doe"
          />

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
            >
            {isSubmitting ? 'Creating Account...' : `Join ${school.name}`}
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default SchoolSpecificSignUpForm;
