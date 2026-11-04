'use client';

import { useEffect, useRef } from 'react';
import { cn, usePrefersReducedMotion } from '@/strata/ui';

const STEP = 1000 / 15;
const DURATION = 1600;
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Counts from zero to `value` in mechanical 15 Hz steps over 1.6 s (expo out) the first time 40 % of it
 * is in view. Writes textContent only; the server and reduced motion render the final value.
 */
export function Counter({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const final = fmt(value);
    el.textContent = fmt(0);
    let raf = 0;
    let shown = -1;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const step = Math.floor((now - t0) / STEP);
          if (step !== shown) {
            shown = step;
            const t = Math.min(1, (step * STEP) / DURATION);
            el.textContent = t >= 1 ? final : fmt(value * expoOut(t));
          }
          if (now - t0 < DURATION) raf = requestAnimationFrame(tick);
          else el.textContent = final;
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = final;
    };
    // fmt depends only on decimals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, reduced]);

  // The final value reserves the width, so the unit after the counter never slides while digits roll in.
  return (
    <span aria-hidden className={cn('inline-grid text-right', className)}>
      <span className="invisible [grid-area:1/1]">{fmt(value)}</span>
      <span ref={ref} className="[grid-area:1/1]" suppressHydrationWarning>
        {fmt(value)}
      </span>
    </span>
  );
}
