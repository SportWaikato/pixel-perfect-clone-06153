import { UserInterface } from '@/models/users/interfaces/UserInterface';

export const Role = {
  STUDENT: 'student',
  SCHOOL_ADMIN: 'school_admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = 'student' | 'school_admin' | 'super_admin';

export const hasRole = (user: UserInterface | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.role === role;
};

export const hasMinimumRole = (user: UserInterface | null, minimumRole: UserRole): boolean => {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    [Role.STUDENT]: 1,
    [Role.SCHOOL_ADMIN]: 2,
    [Role.SUPER_ADMIN]: 3,
  };

  const userRoleLevel = roleHierarchy[user.role];
  const requiredLevel = roleHierarchy[minimumRole];

  return userRoleLevel >= requiredLevel;
};

export const isSuperAdmin = (user: UserInterface | null): boolean => {
  return hasRole(user, Role.SUPER_ADMIN);
};

export const isSchoolAdmin = (user: UserInterface | null): boolean => {
  return hasRole(user, Role.SCHOOL_ADMIN);
};

export const isStudent = (user: UserInterface | null): boolean => {
  return hasRole(user, Role.STUDENT);
};

export const isAdmin = (user: UserInterface | null): boolean =>
  hasMinimumRole(user, 'school_admin');

export const canAccessAdmin = (user: UserInterface | null): boolean => {
  return isSuperAdmin(user);
};

export const getHomePath = (role: UserRole | undefined): string => {
  if (role === Role.SUPER_ADMIN) return '/admin';
  if (role === Role.SCHOOL_ADMIN) return '/admin/dashboard';
  return '/dashboard';
};

export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    [Role.STUDENT]: 'Student',
    [Role.SCHOOL_ADMIN]: 'School Admin',
    [Role.SUPER_ADMIN]: 'Super Admin',
  };

  return roleNames[role];
};
