import { useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
const NavigationProgress = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Pathname changed — complete the bar
  useEffect(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clear();
    setWidth(100);
    timersRef.current = [
      setTimeout(() => setVisible(false), 250),
      setTimeout(() => setWidth(0), 250),
    ];
  }, [pathname, clear]);

  // Listen for internal link clicks
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) return;
      if (href === window.location.pathname) return;

      clear();
      activeRef.current = true;
      setVisible(true);
      setWidth(0);

      // Stagger fake progress ticks
      timersRef.current = [
        setTimeout(() => setWidth(15), 10),
        setTimeout(() => setWidth(40), 300),
        setTimeout(() => setWidth(65), 800),
        setTimeout(() => setWidth(82), 1800),
        setTimeout(() => setWidth(91), 3500),
      ];
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clear();
    };
  }, []);

  if (!visible && width === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] pointer-events-none"
      style={{
        width: `${width}%`,
        opacity: visible ? 1 : 0,
        transition: "width 400ms ease-out, opacity 200ms ease-out",
        background: "linear-gradient(90deg, #00ACEF, #0F8061)",
      }}
    />
  );
};

export default NavigationProgress;
