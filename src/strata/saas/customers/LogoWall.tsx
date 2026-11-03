'use client';

import { useState, type ReactNode } from 'react';

/**
 * Frame for the two marquee rows: pauses them together on hover, while anything inside has focus,
 * and from the pause control (WCAG 2.2.2). Rows are server-rendered children.
 */
export function LogoWall({ children, caption }: { children: ReactNode; caption: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <div data-paused={paused ? '' : undefined} className="group/wall">
      {children}
      <div className="mt-10 flex items-center justify-between gap-6">
        {caption}
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="hud-label -mr-3 inline-flex h-11 items-center gap-2.5 rounded-pill px-3 text-text-3 transition-colors duration-[var(--duration-base)] hover:text-text-1 motion-reduce:hidden"
        >
          <span aria-hidden className="relative inline-flex size-2.5 items-center justify-center">
            {paused ? (
              <svg viewBox="0 0 10 10" className="size-2.5" fill="currentColor">
                <path d="M2 1l7 4-7 4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 10 10" className="size-2.5" fill="currentColor">
                <path d="M2 1h2v8H2zM6 1h2v8H6z" />
              </svg>
            )}
          </span>
          <span className="sr-only">Customer logos: </span>
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>
    </div>
  );
}
