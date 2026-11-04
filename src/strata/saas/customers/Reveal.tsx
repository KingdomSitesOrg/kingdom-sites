'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/strata/ui';

/*
 * Section entrance (STORYBOARD 7): rise 24 px and fade in once 40 % is visible, 600 ms, expo out.
 * The hidden start state applies only with scripting and motion allowed, so the server HTML, no-JS
 * visitors and reduced motion all get the copy in place.
 */
const HIDDEN =
  'motion-safe:[@media(scripting:enabled)]:not-data-in:translate-y-6 motion-safe:[@media(scripting:enabled)]:not-data-in:opacity-0';

export function Reveal({
  children,
  className,
  delay = 0,
  amount = 0.4,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  return (
    <div
      ref={ref}
      data-in={inView ? '' : undefined}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
      className={cn('transition-[opacity,translate] duration-600 ease-out-expo', HIDDEN, className)}
    >
      {children}
    </div>
  );
}
