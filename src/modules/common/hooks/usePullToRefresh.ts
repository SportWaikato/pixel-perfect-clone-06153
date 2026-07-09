import { useEffect, useRef, useState } from "react";

/**
 * Native-style pull-to-refresh for touch devices.
 *
 * Attach the returned ref to a scrollable page container. When the user drags
 * down past the threshold while at the top, `onRefresh` runs and `refreshing`
 * flips true until it resolves. `pullProgress` (0..1) drives an indicator.
 *
 * Touch-only by design — desktop keeps its explicit refresh buttons.
 */
export function usePullToRefresh<T extends HTMLElement>(onRefresh: () => Promise<unknown>) {
  const ref = useRef<T | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined" || !("ontouchstart" in window)) return;

    const THRESHOLD = 72;
    let startY = 0;
    let pulling = false;

    const onTouchStart = (e: TouchEvent) => {
      // Only arm when the page itself is scrolled to the top.
      if (window.scrollY > 4 || refreshing) return;
      startY = e.touches[0].clientY;
      pulling = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0) {
        setPullProgress(0);
        return;
      }
      setPullProgress(Math.min(dy / THRESHOLD, 1));
    };

    const onTouchEnd = async () => {
      if (!pulling) return;
      pulling = false;
      const shouldRefresh = pullProgress >= 1;
      setPullProgress(0);
      if (shouldRefresh) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, refreshing, pullProgress]);

  return { ref, refreshing, pullProgress };
}
