'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { HudLive } from '@/strata/hud';
import { ChapterContext, type ChapterContextValue } from './context';
import { director } from './director';
import { scrollTo } from './nav';
import { StaticStills } from './StaticStills';
import { useStoryStore } from './store';
import type { ChapterDefinition } from './types';

/**
 * One section per chapter in document order: height = length x 100svh (mobile length below 768 px),
 * holding a sticky full-viewport container with the chapter's DOM overlay (and stills in static mode).
 * The section is labelled by the overlay's heading, which must have id `${def.id}-title`.
 */
export function ChapterSection({ def, index }: { def: ChapterDefinition; index: number }) {
  const section = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const isStatic = useStoryStore((s) => s.mode === 'static' && s.booted);

  useLayoutEffect(() => {
    const el = section.current!;
    director.registerSection(index, el, sticky.current!);
    return () => director.unregisterSection(index, el);
  }, [index]);

  // Keyboard focus landing on copy that has faded out (Shift+Tab back into a chapter at p = 1): bring the
  // chapter to the point where its copy is on screen, so the focus ring is never invisible (WCAG 2.4.7).
  useEffect(() => {
    const root = sticky.current!;
    const onFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target.matches(':focus-visible') || effectiveOpacity(target, root) >= 0.95) return;
      void scrollTo(index, director.restP[index] ?? 0.5, { immediate: true });
    };
    root.addEventListener('focusin', onFocus);
    return () => root.removeEventListener('focusin', onFocus);
  }, [index]);

  const ctx = useMemo<ChapterContextValue>(
    () => ({
      index,
      id: def.id,
      def,
      progress: { current: director.progress(index) },
      fx: director.fx(index),
      root: sticky,
      slot: null,
    }),
    [def, index],
  );

  const Overlay = def.Overlay;
  return (
    <section
      ref={section}
      id={def.id}
      data-chapter={index}
      aria-labelledby={`${def.id}-title`}
      className="relative z-10 h-[calc(var(--len-m)*100svh)] md:h-[calc(var(--len-d)*100svh)]"
      style={{ '--len-d': def.length.desktop, '--len-m': def.length.mobile } as CSSProperties}
    >
      <div ref={sticky} className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {isStatic && <StaticStills def={def} index={index} />}
        <ChapterContext.Provider value={ctx}>
          <HudLive value={!isStatic}>
            <div data-overlay className="relative h-full w-full">
              <Overlay />
            </div>
          </HudLive>
        </ChapterContext.Provider>
      </div>
    </section>
  );
}

/** Product of the opacities from `el` up to (not including) `root`. Read once per focus change. */
function effectiveOpacity(el: HTMLElement, root: HTMLElement) {
  let o = 1;
  for (let n: HTMLElement | null = el; n && n !== root; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
  return o;
}
