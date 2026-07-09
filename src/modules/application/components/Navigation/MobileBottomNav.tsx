import { useRouterState, Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import { LayoutDashboard, Trophy, Zap, Calendar, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/modules/common/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/activities", label: "Log Activity", icon: Zap, isFab: true },
  { href: "/feed", label: "Feed", icon: Heart },
  { href: "/challenges", label: "Challenges", icon: Calendar },
  { href: "/announcements", label: "Alerts", icon: MessageCircle },
];

const spring = { type: "spring", stiffness: 500, damping: 32 } as const;

const MobileBottomNav = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-3">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href === "/activities" && pathname?.startsWith("/activities")) ||
            (tab.href === "/challenges" && pathname?.startsWith("/challenges")) ||
            (tab.href === "/achievements" && pathname?.startsWith("/achievements")) ||
            (tab.href === "/feed" && pathname?.startsWith("/feed")) ||
            (tab.href === "/announcements" && pathname?.startsWith("/announcements"));

          if (tab.isFab) {
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className="flex flex-col items-center gap-1 -mt-5"
                aria-label={tab.label}
              >
                <m.span
                  whileTap={{ scale: 0.88 }}
                  transition={spring}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                    isActive ? "bg-brand-green" : "bg-brand-magenta",
                  )}
                >
                  <IconComponent size={24} color="white" />
                </m.span>
                <span
                  className={cn(
                    "text-caption font-medium",
                    isActive ? "text-brand-green" : "text-gray-400",
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
              className="relative flex flex-col items-center gap-1 px-3 pt-1"
              aria-label={tab.label}
            >
              {isActive && (
                <m.span
                  layoutId="bottom-nav-pill"
                  transition={spring}
                  className="absolute -top-2 h-1 w-8 rounded-full bg-brand-green"
                />
              )}
              <m.span
                whileTap={{ scale: 0.85 }}
                animate={{ scale: isActive ? 1.12 : 1 }}
                transition={spring}
                className="flex"
              >
                <IconComponent
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(isActive ? "text-brand-green" : "text-gray-400")}
                  fill={isActive ? "currentColor" : "none"}
                  fillOpacity={isActive ? 0.15 : 0}
                />
              </m.span>
              <span
                className={cn(
                  "text-caption",
                  isActive ? "font-semibold text-brand-green" : "font-medium text-gray-400",
                )}
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
