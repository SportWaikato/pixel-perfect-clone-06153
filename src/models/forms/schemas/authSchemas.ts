import { object, string, ref } from 'yup';
import { SchoolInterface } from '@/models/schools/interfaces/SchoolInterface';
import { YEAR_GROUPS } from '@/models/application/constants/applicationConstants';

const firstNameField = string().trim().required('Enter your first name');
const lastNameField = string().trim().required('Enter your last name');

const usernameField = string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .matches(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores')
  .required('Enter a username');

const signUpPasswordField = string().min(6, 'Password must be at least 6 characters').required('Enter a password');
const confirmPasswordField = string().oneOf([ref('password')], 'Passwords must match').required('Confirm your password');

export const loginSchema = object().shape({
  email: string().email('Enter a valid email').required('Email is required'),
  password: string().required('Password is required'),
});

export const forgotPasswordSchema = object().shape({
  email: string().email('Enter a valid email').required('Email is required'),
});

export const resetPasswordSchema = object().shape({
  password: string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: string()
    .oneOf([ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const inviteRegistrationSchema = object().shape({
  firstName: firstNameField,
  lastName: lastNameField,
  username: usernameField,
  password: signUpPasswordField,
  confirmPassword: confirmPasswordField,
});

const emailMatchesDomains = (email: string, emailDomain: string): boolean => {
  const domains = emailDomain.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
  return domains.some(domain => email.toLowerCase().endsWith('@' + domain));
};

export const createSignUpSchema = (schools: SchoolInterface[]) =>
  object().shape({
    firstName: firstNameField,
    lastName: lastNameField,
    username: usernameField,
    email: string()
      .email('Enter a valid email')
      .required('Enter your email')
      .test('school-email-domain', 'Email must use your school\'s approved domain', function (value) {
        const schoolId = this.parent.school;
        const school = schools.find((s) => s.id === schoolId);
        if (!school?.email_domain || !value) return true;
        return emailMatchesDomains(value, school.email_domain);
      }),
    school: string().required('Select your school'),
    house: string().required('Select a house'),
    yearGroup: string().oneOf([...YEAR_GROUPS], 'Select a valid year group').required('Select your year group'),
    class: string().trim().max(100, 'Class must be at most 100 characters').optional(),
    password: signUpPasswordField,
    confirmPassword: confirmPasswordField,
  });

export const createSchoolSpecificSignUpSchema = (school: SchoolInterface) => {
  const domainList = school.email_domain
    ? school.email_domain.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
    : [];
  const domainMessage = domainList.length > 0
    ? `Must use your school email (${domainList.map(d => '@' + d).join(' or ')})`
    : 'Must use your school email';

  return object().shape({
    firstName: firstNameField,
    lastName: lastNameField,
    username: usernameField,
    email: string()
      .email('Enter a valid email')
      .required('Enter your email')
      .test('school-email-domain', domainMessage, function (value) {
        if (!school.email_domain || !value) return true;
        return emailMatchesDomains(value, school.email_domain);
      }),
    house: string().required('Select a house'),
    yearGroup: string().oneOf([...YEAR_GROUPS], 'Select a valid year group').required('Select your year group'),
    class: string().trim().max(100, 'Class must be at most 100 characters').optional(),
    password: signUpPasswordField,
    confirmPassword: confirmPasswordField,
  });
};
