import { useState, useEffect } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import UserAvatar from "@/modules/application/components/DesignSystem/ui/user-avatar";
import {
  LayoutDashboard,
  Users,
  School,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  Menu,
  X,
  Home,
  LogOut,
  Award,
  FolderOpen,
  Download,
  UserX,
  Monitor,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { EventService } from "@/models/events/services/EventService";
import { toast } from "sonner";

interface AdminLayoutProps {
  user: UserInterface;
  children: React.ReactNode;
}

const AdminLayout = ({ user, children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const router = useRouter();
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = createSupabaseClient();
    const service = new EventService(supabase);
    service
      .getAllPendingCount()
      .then(setPendingEventsCount)
      .catch(() => {});
  }, [user.id]);

  const adminNavItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, current: true },
    { name: "User Management", href: "/admin/users", icon: Users, current: false },
    {
      name: "Deleted Users",
      href: "/admin/deleted-users",
      icon: UserX,
      current: false,
      roles: ["super_admin", "school_admin"],
    },
    { name: "School Management", href: "/admin/schools", icon: School, current: false },
    { name: "Challenge Management", href: "/admin/events", icon: Calendar, current: false },
    { name: "Badge Management", href: "/admin/badges", icon: Award, current: false },
    {
      name: "Manage Media",
      href: "/admin/media",
      icon: FolderOpen,
      current: false,
      roles: ["super_admin", "school_admin"],
    },
    {
      name: "Assembly Mode",
      href: "/admin/assembly",
      icon: Monitor,
      current: false,
      roles: ["super_admin", "school_admin"],
    },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3, current: false },
    { name: "Reports", href: "/admin/reports", icon: FileText, current: false },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: false,
      roles: ["super_admin", "school_admin"],
    },
  ].filter((item) => !item.roles || item.roles.includes(user.role));

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate({ to: "/" });
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4">
            {adminNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                  item.current
                    ? "bg-[#0B4B39]/10 text-[#0B4B39] font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
                {item.href === "/admin/events" && pendingEventsCount > 0 && (
                  <span className="ml-2 w-2 h-2 bg-red-500 rounded-full shrink-0" />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-white border-r">
          <div className="flex h-16 flex-shrink-0 items-center px-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          </div>
          <nav className="flex-1 px-4 py-4">
            {adminNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                  item.current
                    ? "bg-[#0B4B39]/10 text-[#0B4B39] font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
                {item.href === "/admin/events" && pendingEventsCount > 0 && (
                  <span className="ml-2 w-2 h-2 bg-red-500 rounded-full shrink-0" />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900">Super Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Back to main app button */}
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link to="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Back to App
                </Link>
              </Button>

              {/* User menu */}
              <div className="flex items-center gap-x-4">
                <div className="hidden lg:flex lg:items-center lg:gap-x-2">
                  <UserAvatar
                    firstName={user.first_name}
                    lastName={user.last_name}
                    profileIconUrl={user.profile_icon_url}
                    size="sm"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-gray-500">Super Admin</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:ml-2 sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
