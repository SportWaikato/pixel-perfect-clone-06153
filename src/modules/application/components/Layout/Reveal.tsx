import { m } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in seconds — use i * 0.05 inside a list. */
  delay?: number;
  /** Animate every time it scrolls into view instead of just once. */
  repeat?: boolean;
}

/**
 * Scroll-into-view fade + rise, the same motion the landing page and admin
 * dashboard use. Drop it around a section, card, or list item to give any page
 * the app's shared "dynamic" entrance without wiring framer-motion each time.
 */
const Reveal = ({ children, className, delay = 0, repeat = false }: RevealProps) => (
  <m.div
    className={className}
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: !repeat, margin: "-40px" }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
  >
    {children}
  </m.div>
);

export default Reveal;
