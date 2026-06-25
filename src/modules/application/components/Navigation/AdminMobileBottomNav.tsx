import { useState, useEffect } from 'react';
import { useRouterState, Link } from '@tanstack/react-router';
import { useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, Users, MessageSquare, Calendar, User, Building, Award } from 'lucide-react';
import { cn } from '@/modules/common/utils';
import { useUser } from '@/modules/auth/hooks/useUser';
import { Role } from '@/modules/auth/utils/roleUtils';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { EventService } from '@/models/events/services/EventService';
import { SchoolMessageService } from '@/models/schoolMessages/services/SchoolMessageService';

const SCHOOL_ADMIN_TABS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users',     label: 'Users',     icon: Users },
  { href: '/admin/updates',   label: 'Koorero',   icon: MessageSquare },
  { href: '/admin/challenges',    label: 'Challenges',    icon: Calendar },
  { href: '/profile',         label: 'Profile',   icon: User },
];

const SUPER_ADMIN_TABS = [
  { href: '/admin',         label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/schools', label: 'Schools',   icon: Building },
  { href: '/admin/users',   label: 'Users',     icon: Users },
  { href: '/admin/challenges',  label: 'Challenges',    icon: Calendar },
  { href: '/admin/badges',  label: 'Badges',    icon: Award },
];

const AdminMobileBottomNav = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useUser();
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (user.role !== Role.SCHOOL_ADMIN && user.role !== Role.SUPER_ADMIN) return;
    const supabase = createSupabaseClient();
    const service = new EventService(supabase);
    if (user.role === Role.SUPER_ADMIN) {
      service.getAllPendingCount().then(setPendingEventsCount).catch(() => {});
    } else if (user.school_id) {
      service.getPendingCountForSchool(user.school_id).then(setPendingEventsCount).catch(() => {});
    }
  }, [user?.id, user?.school_id, user?.role]);

  useEffect(() => {
    if (!user || user.role !== Role.SCHOOL_ADMIN || !user.school_id) return;
    const supabase = createSupabaseClient();
    const service = new SchoolMessageService(supabase);
    service.countUnreadBySchoolId(user.school_id).then(setUnreadMessagesCount).catch(() => {});
  }, [user?.id, user?.school_id, user?.role]);

  if (!user) return null;

  const tabs = user.role === Role.SUPER_ADMIN ? SUPER_ADMIN_TABS : SCHOOL_ADMIN_TABS;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-3">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = tab.href === '/admin'
            ? pathname === '/admin'
            : pathname === tab.href;

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className="flex flex-col items-center gap-1 px-2 relative"
              aria-label={tab.label}
            >
              <div className="relative">
                <IconComponent
                  size={22}
                  className={cn(isActive ? 'text-[#0B4B39]' : 'text-gray-400')}
                />
                {tab.href === '/admin/challenges' && pendingEventsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
                )}
                {tab.href === '/admin/updates' && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
                )}
              </div>
              <span className={cn('text-xs font-medium', isActive ? 'text-[#0B4B39]' : 'text-gray-400')}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminMobileBottomNav;
