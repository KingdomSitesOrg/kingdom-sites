'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { director } from './director';
import { scrollTo } from './nav';
import { STORY_CHAPTERS } from '@/strata/hud/PhaseRail';

const code = (i: number) => String(i).padStart(2, '0');
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The story's own scroll bar, on the right edge: the whole story from Ignition to Object as one tall
 * track, a mark where each chapter starts, and a handle that shows where you are. Scrolling moves the
 * handle, so a scene that is still playing never feels stuck; dragging the handle (or tapping the
 * track) runs the story to that point, smoothly, through every chapter in between. The arrow keys move
 * a chapter at a time. Gone once the story has scrolled away.
 */
export function StoryScrubber() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const marks = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    const th = thumb.current;
    const lb = label.current;
    if (!el || !tr || !th || !lb) return;
    const n = STORY_CHAPTERS.length;
    // Where each chapter starts, as a share of the whole story (measured on resize, not per frame).
    let starts: number[] = [];
    let tops: number[] = [];
    let top = 0;
    let span = 1;
    let lastT = -1;
    let active = -1;
    let hidden: boolean | null = null;
    let dragging = false;

    const measure = () => {
      if (director.defs.length) director.measure();
      top = director.storyTop;
      span = Math.max(1, director.storyEnd - top - (director.canvasHeight || window.innerHeight));
      tops = STORY_CHAPTERS.map((_, i) => director.scrollYFor(i, 0));
      starts = tops.map((y) => clamp01((y - top) / span));
      starts.forEach((s, i) => {
        const m = marks.current[i];
        if (m) m.style.top = `${(s * 100).toFixed(2)}%`;
      });
      lastT = -1;
    };

    const tick = () => {
      const y = window.scrollY;
      const off = director.storyEnd > 0 && y >= director.storyEnd - window.innerHeight * 0.5;
      if (off !== hidden) {
        hidden = off;
        el.dataset.hidden = off ? 'true' : 'false';
      }
      if (off) return;
      const t = clamp01((y - top) / span);
      if (Math.abs(t - lastT) >= 0.0005) {
        lastT = t;
        th.style.top = `${(t * 100).toFixed(3)}%`;
      }
      // The chapter whose copy is on screen: counted the way the phase rail counts it,
      // from half a screen before the chapter's section starts.
      let i = 0;
      for (let k = 0; k < n; k++) if (y >= tops[k] - window.innerHeight * 0.5) i = k;
      if (i !== active) {
        active = i;
        lb.textContent = `${code(i)} ${STORY_CHAPTERS[i].label}`;
        marks.current.forEach((m, k) => m && (m.dataset.past = k <= i ? 'true' : 'false'));
        el.setAttribute('aria-valuenow', String(i));
        el.setAttribute('aria-valuetext', `${code(i)} ${STORY_CHAPTERS[i].label}`);
      }
    };

    // Runs the story to a point on the track, through Lenis so it glides rather than jumps.
    const seek = (clientY: number) => {
      const r = tr.getBoundingClientRect();
      const y = top + clamp01((clientY - r.top) / r.height) * span;
      const lenis = director.lenis;
      if (lenis) lenis.scrollTo(y, { force: true, lerp: 0.18 });
      else window.scrollTo({ top: y, behavior: 'instant' });
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      dragging = true;
      el.dataset.dragging = 'true';
      el.setPointerCapture(e.pointerId);
      seek(e.clientY);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) seek(e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.dataset.dragging = 'false';
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    const onKey = (e: KeyboardEvent) => {
      const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      const to = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : step ? Math.min(n - 1, Math.max(0, active + step)) : -1;
      if (to < 0) return;
      e.preventDefault();
      void scrollTo(to, 0.15);
    };

    measure();
    tick();
    const ro = new ResizeObserver(() => {
      measure();
      tick();
    });
    ro.observe(document.body);
    gsap.ticker.add(tick);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('keydown', onKey);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      ref={root}
      className="story-scrubber"
      role="slider"
      tabIndex={0}
      aria-label="Story position"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={STORY_CHAPTERS.length - 1}
      aria-valuenow={0}
      aria-valuetext={`00 ${STORY_CHAPTERS[0].label}`}
      data-hidden="false"
      data-dragging="false"
    >
      <div ref={track} className="story-scrubber-track">
        {STORY_CHAPTERS.map((c, i) => (
          <span
            key={c.id}
            ref={(m) => {
              marks.current[i] = m;
            }}
            className="story-scrubber-mark"
            data-past={i === 0 ? 'true' : 'false'}
          />
        ))}
        <div ref={thumb} className="story-scrubber-thumb">
          <span ref={label} className="story-scrubber-label hud-label">{`00 ${STORY_CHAPTERS[0].label}`}</span>
        </div>
      </div>
    </div>
  );
}
