'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

/**
 * Card surface with the cursor glow (STORYBOARD 7.2). The pointer position goes into --mx / --my on
 * the element, so moving across the card never re-renders React.
 */
export function FeatureCard({ children }: { children: ReactNode }) {
  const rect = useRef<DOMRect | null>(null);
  const enter = (e: PointerEvent<HTMLLIElement>) => {
    rect.current = e.currentTarget.getBoundingClientRect();
  };
  const move = (e: PointerEvent<HTMLLIElement>) => {
    const r = rect.current ?? e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <li
      data-card
      onPointerEnter={enter}
      onPointerMove={move}
      className="group/card relative isolate flex flex-col overflow-hidden rounded-[20px] border border-line bg-bg-3 p-8 transition-colors duration-[var(--duration-base)] ease-out-expo hover:border-line-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-[var(--duration-slow)] ease-out-expo group-hover/card:opacity-100"
        style={{
          background:
            'radial-gradient(320px circle at var(--mx, 50%) var(--my, 0%), color-mix(in srgb, var(--molten) 12%, transparent), transparent 60%)',
        }}
      />
      {children}
    </li>
  );
}
