'use client';

import { useEffect } from 'react';
import { useAnimate } from 'framer-motion';
import { usePrefersReducedMotion } from '@/strata/ui';

export type Animate = ReturnType<typeof useAnimate>[1];
export type Play = (animate: Animate, root: SVGSVGElement) => Promise<unknown>;

export const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Plays an icon once when it first comes into view, then loops it while its card is hovered or holds
 * focus. A loop always finishes its cycle, so the icon comes to rest on its final frame, which is also
 * what the server renders and what reduced motion shows.
 */
export function useIconPlayer(play: Play) {
  const [scope, animate] = useAnimate<SVGSVGElement>();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = scope.current;
    if (!el || reduced) return;
    const card = (el.closest<HTMLElement>('[data-card]') ?? el) as HTMLElement;
    let hover = false;
    let focus = false;
    let running = false;
    let alive = true;

    const loop = async () => {
      if (running) return;
      running = true;
      try {
        do await play(animate, el);
        while (alive && (hover || focus));
      } finally {
        running = false;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        void loop();
      },
      { threshold: 0.6 },
    );
    io.observe(el);

    const enter = () => {
      hover = true;
      void loop();
    };
    const leave = () => {
      hover = false;
    };
    const focusIn = () => {
      focus = true;
      void loop();
    };
    const focusOut = (e: FocusEvent) => {
      if (!card.contains(e.relatedTarget as Node | null)) focus = false;
    };
    card.addEventListener('pointerenter', enter);
    card.addEventListener('pointerleave', leave);
    card.addEventListener('focusin', focusIn);
    card.addEventListener('focusout', focusOut);
    return () => {
      alive = false;
      io.disconnect();
      card.removeEventListener('pointerenter', enter);
      card.removeEventListener('pointerleave', leave);
      card.removeEventListener('focusin', focusIn);
      card.removeEventListener('focusout', focusOut);
    };
  }, [scope, animate, play, reduced]);

  return scope;
}

/** Deterministic scatter for icon layouts (mulberry32). */
export function scatter(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
