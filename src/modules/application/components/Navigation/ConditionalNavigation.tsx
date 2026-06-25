'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@/modules/auth/hooks/useUser';
import { Role } from '@/modules/auth/utils/roleUtils';
import MainNavigation from './MainNavigation';
import MobileBottomNav from './MobileBottomNav';
import AdminMobileBottomNav from './AdminMobileBottomNav';

const ConditionalNavigation = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const isAuthPage = pathname?.startsWith('/auth/');
  const isSchoolSignupPage = pathname?.includes('/signup');
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAuthPage || isSchoolSignupPage) return null;

  const showBottomNav = !isAdminPage && user?.role === Role.STUDENT;
  const showAdminBottomNav = user?.role === Role.SCHOOL_ADMIN || user?.role === Role.SUPER_ADMIN;

  return (
    <>
      <MainNavigation />
      {showBottomNav && <MobileBottomNav />}
      {showAdminBottomNav && <AdminMobileBottomNav />}
    </>
  );
};

export default ConditionalNavigation; 