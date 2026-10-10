"use client";

import {
  type RefObject,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * The small amount of movement machinery the front page needs, with no
 * animation library behind it: whether the visitor asked for less motion,
 * whether a piece is on screen, and how far through a tall section the page
 * has scrolled.
 */

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True when the visitor has asked their device for reduced motion. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

/**
 * Whether the element is on screen. With `once`, it stays true after the
 * first time, so an entrance plays once and a loop that should pause off
 * screen passes `once: false`.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { once = true, margin = "0px 0px -15% 0px" } = {},
) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, once, margin]);
  return inView;
}

/**
 * Writes how far the page has scrolled through a tall element, 0 to 1, onto
 * that element as `--p`. CSS reads the number directly, so a scroll moves the
 * picture without React drawing anything.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const progress = travel > 0 ? -rect.top / travel : 0;
      element.style.setProperty(
        "--p",
        Math.min(1, Math.max(0, progress)).toFixed(4),
      );
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ref]);
}

/**
 * Steps through `count` beats every `interval` ms while `running` is true,
 * starting from 0. The front page's small loops (toasts, a counter) run on it
 * and stop when they scroll out of view.
 */
export function useBeat(count: number, interval: number, running: boolean) {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setBeat((current) => (current + 1) % count),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [count, interval, running]);
  return beat;
}
