import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional leading icon in a soft chip. */
  icon?: LucideIcon;
  /** Right-aligned slot for actions, badges, or a CTA. */
  actions?: ReactNode;
  /**
   * "hero" (default): a brand gradient banner with white text and a magenta
   * glow — the same energy as the landing page and admin dashboards, applied
   * consistently across every content page. "plain": the older green-on-light
   * title, kept for the rare surface that needs a lighter touch.
   */
  variant?: "hero" | "plain";
}

/**
 * The shared page header. The `hero` variant gives every screen the same lively
 * gradient banner so the whole PWA reads as one polished system; action buttons
 * passed in should use a light/inverted style to stay readable on the gradient.
 */
const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  variant = "hero",
}: PageHeaderProps) => {
  if (variant === "plain") {
    return (
      <m.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">
              <Icon className="text-brand-green" size={22} />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tight text-brand-green sm:text-4xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-body text-brand-dark/70">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </m.div>
    );
  }

  return (
    <m.div
      className="relative overflow-hidden rounded-3xl px-5 py-6 text-white shadow-sm sm:px-8 sm:py-7"
      style={{ background: "linear-gradient(120deg, #0C4036 0%, #1B5E4B 55%, #118061 100%)" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* magenta glow accent — mirrors the landing hero */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: "#D103D1" }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          {Icon && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Icon className="text-white" size={24} />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1.5 text-sm text-white/70 sm:text-base">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </m.div>
  );
};

export default PageHeader;
