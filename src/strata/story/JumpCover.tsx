'use client';

import { useLayoutEffect, useRef } from 'react';
import { registerCover } from './nav';

/** The full-screen --bg-0 cover the "Watch the fleet" jump fades behind (STORYBOARD 5.1). Mounted once by Story. */
export function JumpCover() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    registerCover(ref.current);
    return () => registerCover(null);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      data-jump-cover
      className="pointer-events-none fixed inset-0 z-overlay bg-bg-0 opacity-0"
    />
  );
}
