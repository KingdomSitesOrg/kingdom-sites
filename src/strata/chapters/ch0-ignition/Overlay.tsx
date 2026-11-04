'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { facts, storyDirector, useChapterProgress, useChapterTimeline, useStoryMode, useStoryTick } from '@/strata/story';
import { storyStore } from '@/strata/story/store';
import { Button, Eyebrow, GlassPanel } from '@/strata/ui';
import { HudCluster, HudReadout, HudValue, fixed, outOf } from '@/strata/hud';
import { HeroHeadline, heroDotCss } from './HeroHeadline';
import { HERO_CSS } from './heroCss';
import { svgMatrix } from './register';
import { K0_SCREEN_Y, K0_VISIBLE_HEIGHT, REVEAL } from './stage';
import { BEAD, BEAD_TOP, desktop, portrait } from './strokes';

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const [vx, vy, vw, vh] = desktop.viewBox;
/** The SVG is sized and placed so it registers with the 3D headline seen from K0 (world origin at 50 % / 42 %). */
const SVG_VH = (vw / K0_VISIBLE_HEIGHT) * 100;
const STATIC_TRANSFORM = `translate(${((vx / vw) * 100).toFixed(3)}%, ${((vy / vh) * 100).toFixed(3)}%)`;
const svgStyle = {
  width: `min(${SVG_VH.toFixed(3)}svh, 94vw)`,
  transform: STATIC_TRANSFORM,
  transformOrigin: '0 0',
  top: `${K0_SCREEN_Y * 100}%`,
} satisfies CSSProperties;
const inkTop = (-desktop.bounds.minZ / K0_VISIBLE_HEIGHT) * 100;
const EYEBROW_CSS = `.ig-eyebrow{top:18svh}@media(min-width:768px){.ig-eyebrow{top:auto;bottom:calc(${(100 - K0_SCREEN_Y * 100).toFixed(1)}% + ${inkTop.toFixed(3)}svh + 30px)}}`;
const STYLE_CSS = HERO_CSS + heroDotCss(desktop, portrait) + EYEBROW_CSS;

const nozzleText = (v: number) => fixed(v, 0, 3);
const NOZZLE_C = facts.fdmProof.nozzleC;
/** The hotend starts the write-on at room temperature. */
const ROOM_C = 24;
const LAYERS = outOf(BEAD.layers, BEAD.layers, 2);
const Z_TOP = fixed(BEAD_TOP, 2, 1);
const PRINTERS = facts.fleet.printers.toLocaleString('en-US');

/** Seconds into the write-on, read from the CSS animation itself once hydrated. */
let writeClock: (() => number) | null = null;

/**
 * The hero of record: eyebrow, h1 (real text, filament SVG beside it), sub-headline, both CTAs, scroll cue and
 * HUD, all server-rendered and complete at first paint. Only the write-on animates on load (CSS). Scroll then
 * hands the headline to the 3D scene underneath and walks the copy out.
 */
export default function Overlay() {
  const mode = useStoryMode();
  const progress = useChapterProgress();
  const fade = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  const svgs = useRef<HTMLSpanElement>(null);
  const deskSvg = useRef<SVGSVGElement | null>(null);
  const heroRest = useRef<HTMLElement[] | null>(null);
  const readyAt = useRef(-1);

  useChapterTimeline(
    (tl) => {
      tl.to('[data-scroll-cue]', { opacity: 0, duration: 0.07 }, 0.02)
        .to('[data-hero-exit]', { opacity: 0, y: -28, duration: 0.1, ease: 'power1.in' }, 0.4)
        .set({}, {}, 1);
    },
    [],
    { rest: 0 },
  );

  // Headline crossfade to the canvas: SVG opacity = 1 - smoothstep(0.10, 0.30, p) x ready. Ready ramps over the
  // canvas's own 900 ms fade-in, so the two never leave a gap. Static mode crossfades to the stills instead.
  useStoryTick((time) => {
    const el = fade.current;
    if (!el) return;
    const s = storyStore.getState();
    const p = progress.current.p;
    let shown: number;
    if (s.mode === 'static') {
      shown = 1 - smooth(REVEAL.staticFrom, REVEAL.staticTo, p);
    } else {
      const slot = storyDirector.slots[0];
      if (readyAt.current < 0 && slot?.compiled && slot.drawn > 0 && s.canvas === 'ready') readyAt.current = time;
      const ready = readyAt.current < 0 ? 0 : s.flags.capture ? 1 : smooth(0, 0.9, time - readyAt.current);
      shown = 1 - smooth(REVEAL.from, REVEAL.to, p) * ready;
      // While both are on screen, the SVG rides the same camera as the 3D headline under it.
      const svg = deskSvg.current;
      const { width: W, height: H } = s.viewport;
      if (svg && W >= 768) {
        const warp = p > 0 && shown > 0.002;
        const tf = warp ? svgMatrix(p, W, H, Math.min((SVG_VH / 100) * H, 0.94 * W), ready) : STATIC_TRANSFORM;
        if (svg.style.transform !== tf) svg.style.transform = tf;
      }
    }
    const v = shown.toFixed(3);
    if (el.style.opacity !== v) el.style.opacity = v;
    const veil = cover.current;
    if (veil) {
      const o = s.mode === 'static' ? v : '0';
      if (veil.style.opacity !== o) veil.style.opacity = o;
    }
    // Static and reduced modes hand the whole hero to still 0 at once, so the copy never outlives its headline.
    const rest = (heroRest.current ??= Array.from(
      veil?.parentElement?.querySelectorAll<HTMLElement>('[data-hero-panel], [data-scroll-cue] > div') ?? [],
    ));
    const o = s.mode === 'static' ? v : '1';
    for (const box of rest) if (box.style.opacity !== o) box.style.opacity = o;
  });

  // The write-on is CSS; JS only bends its clock: an early scroll completes it in 300 ms, capture and static
  // freeze it in its final state, and the NOZZLE readout heats in step with it.
  useEffect(() => {
    const root = svgs.current;
    if (!root) return;
    deskSvg.current = root.querySelector<SVGSVGElement>('[data-hero-svg="desktop"]');
    const anims = root.getAnimations({ subtree: true });
    const finite = anims.filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity));
    const clock = finite.reduce<Animation | null>((best, a) => {
      const end = Number(a.effect?.getComputedTiming().endTime ?? 0);
      return !best || end > Number(best.effect?.getComputedTiming().endTime ?? 0) ? a : best;
    }, null);
    const state = storyStore.getState();
    writeClock = () => (clock ? Number(clock.currentTime ?? 0) / 1000 : 9);
    if (state.flags.capture || state.mode === 'static') {
      for (const a of finite) a.finish();
      for (const a of anims) if (!finite.includes(a)) a.pause();
      return;
    }
    const hurry = () => {
      for (const a of finite) {
        const end = Number(a.effect?.getComputedTiming().endTime ?? 0);
        const left = end - Number(a.currentTime ?? 0);
        if (left > 300) a.updatePlaybackRate(left / 300);
      }
    };
    const events = ['wheel', 'scroll', 'keydown', 'touchstart'] as const;
    for (const e of events) window.addEventListener(e, hurry, { passive: true, once: true });
    return () => {
      for (const e of events) window.removeEventListener(e, hurry);
      writeClock = null;
    };
  }, [mode]);

  return (
    <div className="absolute inset-0">
      <style>{STYLE_CSS}</style>
      <div ref={cover} aria-hidden className="pointer-events-none absolute inset-0 bg-bg-0" style={{ opacity: 0 }} />
      <div data-hero-exit className="absolute inset-0">
        <div ref={fade} data-hero-fade className="pointer-events-none absolute inset-0">
          <Eyebrow className="ig-eyebrow absolute inset-x-0 text-center">
            STRATA · AI design, fleet printing
          </Eyebrow>
          <h1 id="ignition-title" className="absolute inset-0 m-0">
            <span className="sr-only">From thought to thing.</span>
            <span ref={svgs} aria-hidden>
              <HeroHeadline layout={desktop} className="absolute left-1/2 hidden md:block" style={svgStyle} />
              <HeroHeadline
                layout={portrait}
                className="absolute left-1/2 top-[34%] w-[92vw] -translate-x-1/2 -translate-y-1/2 md:hidden"
              />
            </span>
          </h1>
        </div>
        <GlassPanel
          data-hero-panel
          padding="lg"
          className="absolute inset-x-4 top-[56svh] text-center md:inset-x-auto md:left-1/2 md:top-[66%] md:w-[560px] md:-translate-x-1/2 md:-translate-y-1/2"
        >
          <p className="mx-auto max-w-[44ch] text-body text-text-2">
            Describe a part in plain words. STRATA models it, optimizes it and prints it on {PRINTERS} industrial
            machines. Production parts at your door in days.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="#pricing">Start building</Button>
            <Button href="#fleet" variant="secondary">
              Watch the fleet
            </Button>
          </div>
        </GlassPanel>
      </div>
      <div data-scroll-cue aria-hidden className="absolute inset-x-0 bottom-7 flex justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="hud-label text-text-2">Scroll to print</span>
          <span className="relative h-12 w-px bg-line">
            <span className="ig-drip absolute left-1/2 top-0 size-[5px] -ml-[2.5px] rounded-full bg-molten shadow-[0_0_8px_var(--molten)]" />
          </span>
        </div>
      </div>
      <div data-hud className="absolute bottom-[8svh] right-[4vw] flex items-end gap-3 max-md:hidden">
        <HudCluster window={[0.15, 0.8]}>
          <div className="flex gap-6">
            <HudReadout label="Layer" value={LAYERS} />
            <HudReadout desktopOnly label="Z" value={Z_TOP} unit="mm" />
          </div>
        </HudCluster>
        <HudCluster window={[0, 0.9]}>
          <HudReadout
            live
            label="Nozzle"
            chars={3}
            value={<HudValue get={nozzleTemp} fallback={mode === 'static' ? NOZZLE_C : ROOM_C} format={nozzleText} />}
            unit="°C"
          />
        </HudCluster>
      </div>
    </div>
  );
}

/** NOZZLE [T]: room -> 270 C over 2.4 s (power2.out) in step with the write-on, then 270 +- 0.4 [J]. */
function nozzleTemp() {
  if (storyStore.getState().flags.capture) return NOZZLE_C;
  const t = writeClock ? writeClock() : 9;
  if (t < 2.7) {
    const u = Math.min(1, Math.max(0, (t - 0.3) / 2.4));
    return ROOM_C + (NOZZLE_C - ROOM_C) * (1 - (1 - u) * (1 - u));
  }
  return NOZZLE_C + 0.4 * (0.62 * Math.sin(t * 11.9) + 0.38 * Math.sin(t * 19.5 + 1.3));
}
