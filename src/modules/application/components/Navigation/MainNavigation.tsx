import { useState, useEffect } from "react";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/application/components/DesignSystem/ui/dropdown-menu";
import UserAvatar from "@/modules/application/components/DesignSystem/ui/user-avatar";
import { Link, useNavigate, useRouter, useRouterState, useSearch } from "@tanstack/react-router";
import { cn } from "@/modules/common/utils";
import {
  LayoutDashboard,
  Calendar,
  Trophy,
  MessageCircle,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Settings,
  Users,
  Building,
  Award,
  Download,
  Zap,
  Heart,
} from "lucide-react";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { useUser } from "@/modules/auth/hooks/useUser";
import { getHomePath, Role } from "@/modules/auth/utils/roleUtils";
import { SchoolUpdateService } from "@/models/schoolUpdates/services/SchoolUpdateService";
import { SchoolMessageService } from "@/models/schoolMessages/services/SchoolMessageService";
import { EventService } from "@/models/events/services/EventService";
import { toast } from "sonner";

const MainNavigation = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false });
  const { user, loading } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Dynamic navigation items based on user role
  const getNavItemsForRole = (userRole: string) => {
    const baseItems = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];

    if (userRole === Role.SCHOOL_ADMIN) {
      return [
        { href: "/school", label: "Admin Dashboard", icon: Settings },
        { href: "/dashboard", label: "Student Dashboard", icon: LayoutDashboard },
        { href: "/school/users", label: "Manage Users", icon: Users },
        { href: "/school/events", label: "Challenges", icon: Calendar },
        { href: "/school/updates", label: "Announcements", icon: MessageSquare },
        { href: "/school/feed", label: "Feed", icon: Heart },
        { href: "/school/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/school/activity", label: "Activity Log", icon: Zap },
        { href: "/school/settings", label: "Settings", icon: Settings },
      ];
    } else if (userRole === Role.SUPER_ADMIN) {
      return [
        { href: "/admin", label: "Dashboard", icon: Settings },
        { href: "/admin/schools", label: "Schools", icon: Building },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/events", label: "Events", icon: Calendar },
        { href: "/admin/houses", label: "Houses", icon: LayoutDashboard },
        { href: "/admin/badges", label: "Badges", icon: Award },
        { href: "/admin/media", label: "Media", icon: Download },
        { href: "/admin/surveys", label: "Surveys", icon: MessageSquare },
        { href: "/announcements", label: "Announcements", icon: MessageCircle },
      ];
    } else {
      return [
        ...baseItems,
        { href: "/activities", label: "Log Activity", icon: Zap },
        { href: "/challenges", label: "Challenges", icon: Calendar },
        { href: "/feed", label: "Feed", icon: Heart },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/achievements", label: "Badges", icon: Award },
        { href: "/announcements", label: "Announcements", icon: MessageCircle },
      ];
    }
  };

  const navItems = getNavItemsForRole(user?.role || "student");

  useEffect(() => {
    if (!user || user.role !== Role.STUDENT || !user.school_id) return;
    const supabase = createSupabaseClient();
    const service = new SchoolUpdateService(supabase);
    service
      .getUnreadCount(user.school_id, user.id)
      .then(setUnreadCount)
      .catch(() => {});
  }, [user?.id, user?.school_id, user?.role]);

  useEffect(() => {
    if (!user || user.role !== Role.SCHOOL_ADMIN || !user.school_id) return;
    const supabase = createSupabaseClient();
    const service = new SchoolMessageService(supabase);
    service
      .countUnreadBySchoolId(user.school_id)
      .then(setUnreadMessagesCount)
      .catch(() => {});
  }, [user?.id, user?.school_id, user?.role]);

  useEffect(() => {
    if (!user || (user.role !== Role.SCHOOL_ADMIN && user.role !== Role.SUPER_ADMIN)) return;
    const supabase = createSupabaseClient();
    const service = new EventService(supabase);
    if (user.role === Role.SUPER_ADMIN) {
      service
        .getAllPendingCount()
        .then(setPendingEventsCount)
        .catch(() => {});
    } else if (user.school_id) {
      service
        .getPendingCountForSchool(user.school_id)
        .then(setPendingEventsCount)
        .catch(() => {});
    }
  }, [user?.id, user?.school_id, user?.role]);

  const homeHref = getHomePath(user?.role);

  const handleLogout = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate({ to: "/auth" });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Don't render the dropdown if we don't have user data yet
  if (loading || !user) {
    return (
      <nav className="border-b px-4 sm:px-6 py-4" style={{ backgroundColor: "#1B5E4B" }}>
        <div className="flex items-center justify-between">
          {/* Logo and Desktop Navigation Skeleton */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="cursor-pointer hover:opacity-80 transition-opacity">
                <img src="/Logo.svg" alt="Karawhiua Logo" width={66} height={37} />
              </Link>
              <Badge
                variant="secondary"
                className="text-xs hidden md:inline-flex bg-white/20 text-white border-white/30"
              >
                Beta
              </Badge>
            </div>

            {/* Desktop Navigation Skeleton - matches exact Button dimensions */}
            <div className="hidden lg:flex items-center gap-1">
              {[16, 14, 12, 20, 12].map((w, i) => (
                <div
                  key={i}
                  className="h-9 px-4 py-2 bg-white/10 rounded-md animate-pulse flex items-center gap-2"
                >
                  <div className="w-4 h-4 bg-white/20 rounded"></div>
                  <div className={`w-${w} h-4 bg-white/20 rounded`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Mobile menu button skeleton + User avatar skeleton */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex lg:hidden size-9 bg-white/10 rounded-md animate-pulse"></div>
            <div className="size-9 bg-white/10 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="border-b border-white/10 px-4 sm:px-6 py-4"
      style={{ backgroundColor: "#1B5E4B" }}
    >
      <div className="flex items-center justify-between">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center gap-8 min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-3 shrink-0">
            <Link to={homeHref} className="cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/Logo.svg" alt="Karawhiua Logo" width={66} height={37} />
            </Link>
            <Badge
              variant="secondary"
              className="text-xs hidden md:inline-flex bg-white/20 text-white border-white/30"
            >
              Beta
            </Badge>
          </div>

          {/* Desktop Navigation - Left aligned after logo */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isSchoolDashboard =
                pathname === "/admin" && !!(searchParams as { schoolId?: string }).schoolId;
              const isActive =
                pathname === item.href || (item.href === "/admin/schools" && isSchoolDashboard);

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={cn(
                    "gap-2 text-white hover:bg-white/20 hover:text-white",
                    isActive && "bg-white/20 text-white",
                  )}
                >
                  <Link to={item.href}>
                    <IconComponent size={16} />
                    {item.label}
                    {item.href === "/school/events" && pendingEventsCount > 0 && (
                      <span className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
                    )}
                    {item.href === "/school/updates" && unreadMessagesCount > 0 && (
                      <span className="w-2 h-2 bg-blue-400 rounded-full shrink-0" />
                    )}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Right side - Log Activity FAB + Bell icon + Mobile menu button + User dropdown */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button — tablet only (md to lg) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex lg:hidden text-white hover:bg-white/20 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20">
                <UserAvatar
                  firstName={user.first_name}
                  lastName={user.last_name}
                  profileIconUrl={user.profile_icon_url}
                  size="md"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <User size={16} />
                  Profile
                </Link>
              </DropdownMenuItem>
              {(user.role === Role.SCHOOL_ADMIN || user.role === Role.SUPER_ADMIN) && (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Settings size={16} />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600"
              >
                <LogOut size={16} />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tablet Navigation Menu (md to lg) */}
      {mobileMenuOpen && (
        <div className="hidden md:block lg:hidden border-t border-white/10 mt-4 pt-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isSchoolDashboard =
                pathname === "/admin" && !!(searchParams as { schoolId?: string }).schoolId;
              const isActive =
                pathname === item.href || (item.href === "/admin/schools" && isSchoolDashboard);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <IconComponent size={18} />
                  {item.label}
                  {item.href === "/school/events" && pendingEventsCount > 0 && (
                    <span className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
                  )}
                  {item.href === "/school/updates" && unreadMessagesCount > 0 && (
                    <span className="w-2 h-2 bg-blue-400 rounded-full shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default MainNavigation;
