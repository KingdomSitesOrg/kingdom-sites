'use client';

import { useId, useState } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { cn, usePrefersReducedMotion } from '@/strata/ui';

export type FaqItem = { id: string; question: string; answer: string };

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * STORYBOARD 7.8: each question is an h3 wrapping a button (aria-expanded, aria-controls); the answer is a
 * region labelled by it. One open at a time; Framer height animation 240 ms, instant under reduced motion.
 * Closed answers stay in the DOM (inert) so every word is server-rendered.
 */
export function FaqAccordion({ items, defaultOpen }: { items: readonly FaqItem[]; defaultOpen?: string }) {
  const uid = useId();
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  const transition = { duration: reduced ? 0 : 0.24, ease: EASE };

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="border-t border-line">
        {items.map((item, i) => {
          const isOpen = open === item.id;
          const buttonId = `${uid}-q-${item.id}`;
          const panelId = `${uid}-a-${item.id}`;
          return (
            <div key={item.id} className="border-b border-line">
              <h3 className="font-text">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : item.id)}
                  className="group/faq flex w-full items-center justify-between gap-8 rounded-md py-6 text-left"
                >
                  <span className="flex items-baseline gap-5">
                    <span
                      aria-hidden
                      className={cn(
                        'w-5 shrink-0 font-mono text-[12px] tabular transition-colors duration-[var(--duration-base)]',
                        isOpen ? 'text-molten' : 'text-text-3 group-hover/faq:text-text-2',
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'text-[18px] font-medium leading-7 tracking-[-0.01em] transition-[color,translate] duration-[var(--duration-base)] ease-out-expo',
                        isOpen ? 'text-text-1' : 'text-text-1/85 group-hover/faq:translate-x-1 group-hover/faq:text-text-1',
                      )}
                    >
                      {item.question}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      'relative flex size-8 shrink-0 items-center justify-center rounded-full border transition-[border-color,background-color,rotate] duration-[240ms] ease-out-expo',
                      isOpen
                        ? 'rotate-45 border-molten/60 bg-molten/10 text-molten'
                        : 'border-line-strong text-text-2 group-hover/faq:border-text-2 group-hover/faq:bg-white/[0.06] group-hover/faq:text-text-1',
                    )}
                  >
                    <span className="absolute h-px w-3 bg-current" />
                    <span className="absolute h-3 w-px bg-current" />
                  </span>
                </button>
              </h3>
              <m.div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                inert={!isOpen}
                initial={false}
                animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                transition={transition}
                className="overflow-hidden"
              >
                <p className="max-w-[60ch] pb-7 pl-10 pr-14 text-body text-text-2">{item.answer}</p>
              </m.div>
            </div>
          );
        })}
      </div>
    </LazyMotion>
  );
}
