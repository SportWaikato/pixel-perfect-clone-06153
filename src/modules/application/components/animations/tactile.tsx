import { type HTMLMotionProps, m } from "framer-motion";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

const squishSpring = { type: "spring" as const, stiffness: 500, damping: 20 };
const gentleSpring = { type: "spring" as const, stiffness: 300, damping: 25 };

export const squishyTap = {
  whileTap: { scale: 0.92, transition: squishSpring },
  whileHover: { scale: 1.03, transition: { duration: 0.15 } },
};

export const cardSpring = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  whileHover: {
    y: -4,
    boxShadow: "0 12px 24px -8px rgba(0,0,0,0.12)",
    transition: { duration: 0.2 },
  },
};

export const popIn = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: gentleSpring },
};

export const BadgePop = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => (
    <m.div ref={ref} {...popIn} {...props}>
      {children}
    </m.div>
  ),
);
BadgePop.displayName = "BadgePop";

export const NumberReveal = ({ value, className }: { value: number; className?: string }) => (
  <m.span
    key={value}
    initial={{ y: 12, opacity: 0, scale: 0.8 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    transition={gentleSpring}
    className={className}
  >
    {value.toLocaleString()}
  </m.span>
);

export const SquishyButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof m.button>
>(({ children, ...props }, ref) => (
  <m.button ref={ref} {...squishyTap} {...props}>
    {children}
  </m.button>
));
SquishyButton.displayName = "SquishyButton";

export const SpringCard = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => (
    <m.div ref={ref} {...cardSpring} {...props}>
      {children}
    </m.div>
  ),
);
SpringCard.displayName = "SpringCard";
