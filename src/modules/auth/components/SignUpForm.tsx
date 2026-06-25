import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import { useRouter, useNavigate } from '@tanstack/react-router';
import { createSignUpSchema } from '@/models/forms/schemas/authSchemas';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { UserService } from '@/models/users/services/UserService';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { SelectItem, Select, SelectContent, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';
import { Label } from '@/modules/application/components/DesignSystem/ui/label';
import { Input } from '@/modules/application/components/DesignSystem/ui/input';
import { FormikInputField, FormikSelectField } from '@/modules/common/components/Formik';
import { YEAR_GROUPS } from '@/models/application/constants/applicationConstants';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { useState, useMemo } from 'react';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { HouseInterface } from '@/models/houses/interfaces/HouseInterface';
import { cn } from '@/modules/common/utils';
import { getHousesBySchool } from '@/modules/auth/actions/getHousesBySchool';
import { isEmailAllowedResult } from '@/models/allowed-emails/utils/isEmailAllowed';

interface SignUpFormProps {
  schools: SchoolInterface[];
}

type SignUpValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  school: string;
  house: string;
  yearGroup: string;
  class: string;
  password: string;
  confirmPassword: string;
};

const SignUpForm = ({ schools }: SignUpFormProps) => {
  const [matchingSchools, setMatchingSchools] = useState<SchoolInterface[]>([]);
  const [emailDomainError, setEmailDomainError] = useState(false);
  const [availableHouses, setAvailableHouses] = useState<HouseInterface[]>([]);
  const router = useRouter();
  const navigate = useNavigate();

  const validationSchema = useMemo(() => createSignUpSchema(schools), [schools]);

  const fetchHouses = async (schoolId: string) => {
    if (!schoolId) return;
    const houses = await getHousesBySchool(schoolId);
    setAvailableHouses(houses);
  };

  const handleEmailChange = (value: string, setFieldValue: (field: string, value: any) => void) => {
    const atIndex = value.indexOf('@');

    if (atIndex === -1) {
      setMatchingSchools([]);
      setEmailDomainError(false);
      setAvailableHouses([]);
      setFieldValue('school', '');
      setFieldValue('house', '');
      return;
    }

    const domain = value.slice(atIndex + 1).toLowerCase().trim();
    if (!domain) return;

    const matches = schools.filter(
      (s) => s.email_domain && s.email_domain.split(',').map(d => d.trim().toLowerCase()).some(d => d === domain)
    );

    if (matches.length === 1) {
      setMatchingSchools(matches);
      setEmailDomainError(false);
      setFieldValue('school', matches[0].id);
      setFieldValue('house', '');
      fetchHouses(matches[0].id);
    } else if (matches.length > 1) {
      setMatchingSchools(matches);
      setEmailDomainError(false);
      setAvailableHouses([]);
      setFieldValue('school', '');
      setFieldValue('house', '');
    } else {
      setMatchingSchools([]);
      setEmailDomainError(true);
      setAvailableHouses([]);
      setFieldValue('school', '');
      setFieldValue('house', '');
    }
  };

  const handleSubmit = async (values: SignUpValues, { setSubmitting, setFieldError }: FormikHelpers<SignUpValues>) => {
    try {
      const supabase = createSupabaseClient();

      const { data: isAllowed } = await supabase.rpc('is_email_allowed', {
        p_school_id: values.school,
        p_email: values.email,
      });
      if (!isEmailAllowedResult(isAllowed)) {
        throw new Error('This email address is not on the approved list for this school. Please contact your school administrator.');
      }

      const userService = new UserService(supabase);
      if (await userService.isUsernameTaken(values.username)) {
        setFieldError('username', 'Username is already taken');
        return;
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
        school_id: values.school,
        house_id: values.house,
        year_group: values.yearGroup,
        class: values.class || undefined,
        is_admin: false,
        is_public: true,
        total_kilometers: 0,
      });

      toast.success('Account created successfully!');
      navigate({ to: '/auth/login' });
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
        school: '',
        house: '',
        yearGroup: '',
        class: '',
        password: '',
        confirmPassword: '',
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, values, setFieldValue }) => {
        const multipleMatches = matchingSchools.length > 1;

        return (
          <Form className="space-y-5">
            {/* School Details section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-bold tracking-wide text-primary uppercase">School Details</span>
                <div className="flex-1 h-px bg-primary/20" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Field name="email">
                    {({ field, meta }: any) => (
                      <>
                        <Label htmlFor="email">School Email</Label>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="john.doe@school.edu"
                          className={meta.touched && meta.error ? 'border-red-500' : ''}
                          onChange={(e) => {
                            field.onChange(e);
                            handleEmailChange(e.target.value, setFieldValue);
                          }}
                        />
                        <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                        {emailDomainError && (
                          <p className="text-red-500 text-sm">
                            It looks like you&apos;re trying to create an account without a recognised school email address, please use your school email
                          </p>
                        )}
                      </>
                    )}
                  </Field>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Field name="school">
                    {({ field, form, meta }: any) => (
                      <>
                        {matchingSchools.length === 1 ? (
                          <div className={cn(
                            'flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-70 cursor-not-allowed',
                            meta.touched && meta.error ? 'border-red-500' : ''
                          )}>
                            {matchingSchools[0].name}
                          </div>
                        ) : (
                          <Select
                            value={field.value}
                            disabled={matchingSchools.length === 0}
                            onValueChange={(value) => {
                              form.setFieldValue('school', value);
                              form.setFieldValue('house', '');
                              fetchHouses(value);
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                'w-full',
                                meta.touched && meta.error ? 'border-red-500' : '',
                                matchingSchools.length === 0 && 'cursor-not-allowed opacity-60'
                              )}
                            >
                              <SelectValue
                                placeholder={
                                  multipleMatches
                                    ? 'Select your school'
                                    : !values.email.includes('@')
                                      ? 'Enter your email first'
                                      : 'No matching school found'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {matchingSchools.map((school) => (
                                <SelectItem key={school.id} value={school.id}>
                                  {school.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <ErrorMessage name="school" component="div" className="text-red-500 text-sm" />
                      </>
                    )}
                  </Field>
                </div>

                <div className={cn('space-y-2', !values.school && 'opacity-50')}>
                  <Label htmlFor="house">House/Team</Label>
                  <Field name="house">
                    {({ field, form, meta }: any) => (
                      <>
                        <Select
                          value={field.value}
                          onValueChange={(value) => form.setFieldValue('house', value)}
                          disabled={!values.school}
                        >
                          <SelectTrigger
                            className={cn(
                              'w-full',
                              meta.touched && meta.error ? 'border-red-500' : '',
                              !values.school && 'cursor-not-allowed'
                            )}
                          >
                            <SelectValue
                              placeholder={!values.school ? 'Enter your email first' : 'Select your house'}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableHouses.map((house) => (
                              <SelectItem key={house.id} value={house.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: house.color }} />
                                  {house.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ErrorMessage name="house" component="div" className="text-red-500 text-sm" />
                      </>
                    )}
                  </Field>
                </div>

                <FormikSelectField name="yearGroup" label="Year Group">
                  {YEAR_GROUPS.map((yg) => (
                    <SelectItem key={yg} value={yg}>{yg}</SelectItem>
                  ))}
                </FormikSelectField>
                <FormikInputField name="class" label="Class (optional)" placeholder="e.g. 10B" />
              </div>
            </div>

            {/* Your Details section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-bold tracking-wide text-primary uppercase">Your Details</span>
                <div className="flex-1 h-px bg-primary/20" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormikInputField name="firstName" label="First Name" placeholder="John" />
                  <FormikInputField name="lastName" label="Last Name" placeholder="Doe" />
                </div>
                <FormikInputField name="username" label="Username" placeholder="john.doe" />
                <FormikInputField name="password" label="Password" type="password" placeholder="Enter password" />
                <FormikInputField name="confirmPassword" label="Confirm Password" type="password" placeholder="Confirm password" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 font-bold rounded-xl"
              >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Form>
        );
      }}
    </Formik>
  );
};

export default SignUpForm;
