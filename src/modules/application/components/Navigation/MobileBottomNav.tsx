import { useRouterState, Link } from "@tanstack/react-router";
import { LayoutDashboard, Trophy, Zap, Calendar, Heart } from "lucide-react";
import { cn } from "@/modules/common/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/activities", label: "Log Activity", icon: Zap, isFab: true },
  { href: "/feed", label: "Feed", icon: Heart },
  { href: "/events", label: "Events", icon: Calendar },
];

const MobileBottomNav = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-3">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href === "/activities" && pathname?.startsWith("/activities")) ||
            (tab.href === "/events" && pathname?.startsWith("/events")) ||
            (tab.href === "/achievements" && pathname?.startsWith("/achievements")) ||
            (tab.href === "/feed" && pathname?.startsWith("/feed"));

          if (tab.isFab) {
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className="flex flex-col items-center gap-1 -mt-5"
                aria-label={tab.label}
              >
                <span
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
                    isActive ? "bg-[#0B4B39]" : "bg-[#D103D1]",
                  )}
                >
                  <IconComponent size={24} color="white" />
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive ? "text-[#0B4B39]" : "text-gray-400",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className="flex flex-col items-center gap-1 px-2"
              aria-label={tab.label}
            >
              <IconComponent
                size={22}
                className={cn(isActive ? "text-[#0B4B39]" : "text-gray-400")}
              />
              <span
                className={cn("text-xs font-medium", isActive ? "text-[#0B4B39]" : "text-gray-400")}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
