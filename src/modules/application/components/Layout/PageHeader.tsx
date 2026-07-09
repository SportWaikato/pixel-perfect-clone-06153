import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional leading icon in a soft brand chip. */
  icon?: LucideIcon;
  /** Right-aligned slot for actions, badges, or a CTA. */
  actions?: ReactNode;
}

/**
 * The shared page header — big condensed Antonio title in brand green with a
 * muted subtitle, matching the landing page's typographic energy and the admin
 * dashboard's practical title/subtitle layout. Animates in on mount so every
 * screen opens with the same lively feel.
 */
const PageHeader = ({ title, subtitle, icon: Icon, actions }: PageHeaderProps) => (
  <m.div
    className="flex items-start justify-between gap-4"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
  >
    <div className="flex items-center gap-3 min-w-0">
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

export default PageHeader;
