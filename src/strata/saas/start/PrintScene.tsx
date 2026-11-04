'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useStoryMode } from '@/strata/story';
import { cn } from '@/strata/ui';
import './start.css';

gsap.registerPlugin(ScrollTrigger);

type PrintSceneProps = {
  children: ReactNode;
  /** Discrete reveal steps (84). */
  steps: number;
  /** Layer count and layer height for the readout (840 x 0.05 mm). */
  layers: number;
  layerMM: number;
  /** Per-step [left, right] material edges in `width` units; null sweeps most of the frame (the still). */
  extents: readonly (readonly [number, number])[] | null;
  width: number;
  className?: string;
};

/**
 * The #start section root. Scrubs the print by scroll ("top 70%" -> "center center") and writes only CSS
 * variables, a data attribute and two readout strings: no React state on scroll. Reduced motion and static
 * mode keep the server's finished state.
 */
export function PrintScene({ children, steps, layers, layerMM, extents, width, className }: PrintSceneProps) {
  const ref = useRef<HTMLElement>(null);
  const mode = useStoryMode();

  useEffect(() => {
    const root = ref.current;
    if (!root || mode === 'static') return;
    const layerEl = root.querySelector<HTMLElement>('[data-layer]');
    const zEl = root.querySelector<HTMLElement>('[data-z]');
    const finalLayer = layerEl?.textContent ?? '';
    const finalZ = zEl?.textContent ?? '';
    let lastStep = -1;
    let lastLayer = -1;
    let lastPhase = '';

    const apply = (progress: number) => {
      const s = Math.min(Math.max(progress, 0), 1);
      const exact = s * steps;
      const step = Math.min(Math.floor(exact), steps);
      if (step !== lastStep) {
        lastStep = step;
        root.style.setProperty('--h', String(step / steps));
      }
      const [a, b] = extents?.[Math.min(step, steps - 1)] ?? [width * 0.14, width * 0.86];
      const t = step >= steps ? 1 : exact - step;
      root.style.setProperty('--x', ((a + (b - a) * t) / width).toFixed(4));
      const layer = Math.min(Math.floor(s * layers), layers);
      if (layer !== lastLayer) {
        lastLayer = layer;
        if (layerEl) layerEl.textContent = String(layer).padStart(4, '0');
        if (zEl) zEl.textContent = (layer * layerMM).toFixed(2).padStart(5, '0');
      }
      const phase = s >= 1 ? 'done' : 'printing';
      if (phase !== lastPhase) {
        lastPhase = phase;
        root.dataset.phase = phase;
      }
    };

    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top 70%',
      end: 'center center',
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    apply(st.progress);

    return () => {
      st.kill();
      delete root.dataset.phase;
      root.style.removeProperty('--h');
      root.style.removeProperty('--x');
      if (layerEl) layerEl.textContent = finalLayer;
      if (zEl) zEl.textContent = finalZ;
    };
  }, [mode, steps, layers, layerMM, extents, width]);

  return (
    <section ref={ref} id="start" aria-labelledby="start-title" className={cn('saas-print', className)}>
      {children}
    </section>
  );
}
