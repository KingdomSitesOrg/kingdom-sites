'use client';

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useStoryStore } from './store';

const MiniCanvasImpl = dynamic(() => import('./canvas/MiniCanvasImpl'), { ssr: false });

/** A module whose default export is the R3F content (loaded inside the lazy canvas chunk). */
export type MiniCanvasContent = () => Promise<{ default: ComponentType }>;

export interface MiniCanvasProps {
  /**
   * Loader for the R3F content: `content={() => import('./Spinner')}`, a module constant. It is imported only
   * inside the lazy canvas chunk, so three.js and R3F never reach the page's first-load bundle. Never import
   * R3F components statically into a SaaS client component.
   */
  content: MiniCanvasContent;
  /** Shown before the canvas loads, in static mode, and while far off screen. Make it look finished (SVG/CSS). */
  fallback?: ReactNode;
  className?: string;
  camera?: { position?: [number, number, number]; fov?: number };
  /** Max device-pixel ratio for this canvas (default 1.5, 1 on the low tier). */
  maxDpr?: number;
}

/**
 * A small, self-contained R3F canvas for SaaS icons and demos. Loads when it comes near the
 * viewport, renders only while visible, and shows `fallback` in static mode. Each one is a WebGL
 * context (browsers cap them at about 16): keep it to six or fewer on the page.
 */
export function MiniCanvas({ content, fallback = null, className, camera, maxDpr }: MiniCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useStoryStore((s) => s.booted && !s.reducedMotion && s.mode === 'webgl');
  const low = useStoryStore((s) => s.quality === 'low');
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !live) return;
    const nearObs = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '75% 0px' });
    const viewObs = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    nearObs.observe(el);
    viewObs.observe(el);
    return () => {
      nearObs.disconnect();
      viewObs.disconnect();
    };
  }, [live]);

  return (
    <div ref={ref} className={className} style={{ position: 'relative' }}>
      {live && near ? (
        <MiniCanvasImpl active={inView} camera={camera} maxDpr={maxDpr ?? (low ? 1 : 1.5)} fallback={fallback} content={content} />
      ) : (
        fallback
      )}
    </div>
  );
}
