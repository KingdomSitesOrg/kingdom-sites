'use client';

import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/strata/ui';
import './reveal.css';

type RevealProps = ComponentPropsWithoutRef<'div'> & {
  as?: 'div' | 'ul' | 'ol';
  /** Share of the group (or of the viewport, for tall groups) that must be visible. */
  amount?: number;
};

/**
 * Plays the SaaS entrance once for every [data-reveal] descendant when the group is `amount` in view,
 * or at once when anything inside takes focus. Writes a data attribute; no React state.
 */
export function Reveal({ as = 'div', amount = 0.4, className, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => {
      el.dataset.shown = '';
      io.disconnect();
      el.removeEventListener('focusin', show);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        const seen = entry.intersectionRatio >= amount || entry.intersectionRect.height >= window.innerHeight * amount;
        if (entry.isIntersecting && seen) show();
      },
      { threshold: [0, 0.1, 0.2, 0.3, amount] },
    );
    io.observe(el);
    el.addEventListener('focusin', show);
    return () => {
      io.disconnect();
      el.removeEventListener('focusin', show);
    };
  }, [amount]);

  const Tag = as as 'div';
  return <Tag ref={ref} className={cn('saas-reveal', className)} {...rest} />;
}
