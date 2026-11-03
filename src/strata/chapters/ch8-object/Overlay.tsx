'use client';

import { useEffect, useRef, type CSSProperties, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { useStoryStore } from '@/strata/story/store';
import { Button, Eyebrow, GlassPanel } from '@/strata/ui';
import {
  facts,
  isCapture,
  partStore,
  storyDirector,
  useChapterProgress,
  useChapterTimeline,
  usePartStore,
  useStoryMode,
  useStoryTick,
} from '@/strata/story';
import { BBoxBrackets, HudCluster } from '@/strata/hud';
import { chooseMaterial, MATERIAL_KEYS, shownOf, SPEC, swapAt, type MaterialIndex, type SwapState } from './choice';
import { Roll, writeRoll } from './Roll';
import { signals } from './signals';

const DEG = Math.PI / 180;
const wrapDeg = (d: number) => ((Math.round(d) % 360) + 360) % 360;
const SPEC_IN = 0.4;
const env = facts.part.envelopeMM;

export default function Overlay() {
  const prog = useChapterProgress();
  const group = useRef<HTMLDivElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const slider = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const leader = useRef<SVGSVGElement>(null);
  const rolls = useRef<(HTMLSpanElement | null)[]>([]);
  const srs = useRef<(HTMLSpanElement | null)[]>([]);
  const live = useRef<HTMLSpanElement>(null);
  const ui = useRef({
    checked: 0 as MaterialIndex,
    shown: 0 as MaterialIndex,
    deg: -1,
    dragX: 0,
    dragged: false,
    swap: { from: 0, to: 0, k: 0 } as SwapState,
    card: { x: 0, y: 0, w: 0, h: 0 },
    column: { x0: 0, x1: 0 },
    leaderOn: false,
    ax: 0,
    ay: 0,
  });

  useChapterTimeline(
    (tl) => {
      tl.from('[data-copy]', { opacity: 0, duration: 0.05 }, 0)
        .from('[data-reveal]', { opacity: 0, y: 24, duration: 0.08, stagger: 0.02, ease: 'expo.out' }, 0.01)
        .from('[data-controls]', { opacity: 0, y: 16, duration: 0.08, ease: 'expo.out' }, 0.05)
        .set({}, {}, 1);
    },
    [],
  );
  // 8 -> SaaS: the spec card leaves as #customers slides up; the leader and brackets (glued to the part) go first.
  useChapterTimeline((tl) => void tl.to('[data-exit]', { opacity: 0, duration: 0.12 }, 0).set({}, {}, 1), [], {
    source: 'exit',
    rest: 0,
  });

  useEffect(() => {
    const measure = () => {
      const el = card.current;
      const u = ui.current;
      if (el) u.card = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      const w = window.innerWidth;
      u.column.x0 = w * 0.06 - 24;
      u.column.x1 = w * 0.06 + Math.min(w * 0.34, 520) + 24;
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (card.current) ro.observe(card.current);
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      signals.held = 0;
    };
  }, []);

  const applyChecked = (i: MaterialIndex) => {
    ui.current.checked = i;
    group.current?.style.setProperty('--i', String(i));
    radios.current.forEach((b, j) => {
      if (!b) return;
      b.setAttribute('aria-checked', j === i ? 'true' : 'false');
      b.tabIndex = j === i ? 0 : -1;
      b.dataset.checked = j === i ? 'true' : 'false';
    });
  };

  const applySpec = (i: MaterialIndex) => {
    const s = SPEC[i];
    writeRoll(rolls.current[0], s.massG, 2);
    writeRoll(rolls.current[1], s.unitPrice, 3, 2);
    writeRoll(rolls.current[2], s.leadDays, 1);
    const sr = srs.current;
    if (sr[0]) sr[0].textContent = `${s.massG} grams`;
    if (sr[1]) sr[1].textContent = `$${s.unitPrice.toFixed(2)}`;
    if (sr[2]) sr[2].textContent = `${s.leadDays} business days`;
  };

  useStoryTick(() => {
    const pr = prog.current;
    if (!pr.visible) return;
    const u = ui.current;
    const pinned = partStore.getState().materialPinned && !isCapture();
    const sw = swapAt(pr.p, storyDirector.time, u.swap);
    const shown = shownOf(sw);
    const checked = (pinned ? sw.to : shown) as MaterialIndex;
    if (checked !== u.checked) applyChecked(checked);
    if (shown !== u.shown) {
      u.shown = shown;
      applySpec(shown);
    }

    if (!signals.held) writeDeg(signals.yawDeg);

    const svg = leader.current;
    if (svg) {
      const a = signals.anchors.collar;
      const c = u.card;
      const ax = a[0];
      const ay = a[1];
      const ty = c.y + c.h;
      const on = pr.p >= SPEC_IN && pr.exit < 0.03 && a[2] > 0.5 && c.w > 0 && ax > u.column.x1 && ay - ty > 24;
      if (on && (Math.abs(ax - u.ax) > 0.2 || Math.abs(ay - u.ay) > 0.2)) {
        u.ax = ax;
        u.ay = ay;
        const tx = Math.min(Math.max(ax, c.x + 28), c.x + c.w - 28);
        const run = tx - ax;
        const len = Math.min(Math.abs(run), ay - ty);
        const ex = ax + Math.sign(run) * len;
        const ey = ay - len;
        const path = svg.firstElementChild as SVGPathElement;
        const dot = svg.lastElementChild as SVGCircleElement;
        path.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}L${(len < Math.abs(run) ? tx : ex).toFixed(1)} ${ty}`);
        dot.setAttribute('cx', ax.toFixed(1));
        dot.setAttribute('cy', ay.toFixed(1));
      }
      if (on !== u.leaderOn) {
        u.leaderOn = on;
        svg.dataset.visible = on ? 'true' : 'false';
      }
    }
  });

  const writeDeg = (deg: number) => {
    const sl = slider.current;
    if (!sl || deg === ui.current.deg) return;
    ui.current.deg = deg;
    sl.setAttribute('aria-valuenow', String(deg));
    sl.setAttribute('aria-valuetext', `${deg} degrees`);
  };

  const choose = (i: MaterialIndex) => {
    applyChecked(i);
    chooseMaterial(i, ui.current.shown, storyDirector.time);
    const s = SPEC[i];
    if (live.current) live.current.textContent = `${s.name}: ${s.massG} grams, $${s.unitPrice.toFixed(2)}, ${s.leadDays} business days`;
  };

  const onRadioKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const cur = ui.current.checked;
    const next: Record<string, number> = { ArrowRight: cur + 1, ArrowDown: cur + 1, ArrowLeft: cur - 1, ArrowUp: cur - 1, Home: 0, End: 2 };
    if (!(e.key in next)) return;
    e.preventDefault();
    const i = (((next[e.key] % 3) + 3) % 3) as MaterialIndex;
    choose(i);
    radios.current[i]?.focus();
  };

  const touch = () => {
    signals.lastInput = storyDirector.time;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    signals.dragging = 1;
    signals.held = 0;
    signals.yawVel = 0;
    ui.current.dragX = e.clientX;
    touch();
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!signals.dragging) return;
    signals.dragDX += e.clientX - ui.current.dragX;
    ui.current.dragX = e.clientX;
    touch();
    if (!ui.current.dragged && Math.abs(signals.dragDX) > 2) {
      ui.current.dragged = true;
      hint.current?.setAttribute('data-done', 'true');
    }
  };
  const onUp = () => {
    signals.dragging = 0;
    touch();
  };
  const onSliderKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = (signals.yaw + signals.keyYaw) / DEG;
    const now = wrapDeg(target);
    const by: Record<string, number> = { ArrowRight: 15, ArrowUp: 15, ArrowLeft: -15, ArrowDown: -15, PageUp: 45, PageDown: -45, Home: -now, End: 359 - now };
    if (!(e.key in by)) return;
    e.preventDefault();
    let d = by[e.key];
    if (e.key === 'Home' || e.key === 'End') d = ((d % 360) + 540) % 360 - 180;
    signals.held = 1;
    signals.keyYaw += (Math.round(target) - target + d) * DEG;
    writeDeg(wrapDeg(now + d));
    touch();
  };
  const onSliderFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.matches(':focus-visible')) signals.held = 1;
    touch();
  };
  const onSliderBlur = () => {
    signals.held = 0;
    touch();
  };

  const quote = () => {
    partStore.getState().setQuotePreset({ object: 'bracket', material: MATERIAL_KEYS[ui.current.checked], q: 1 });
  };

  const bracketP = () => {
    const pr = prog.current;
    return pr.visible && pr.exit < 0.03 ? pr.p : -1;
  };

  const first = SPEC[0];
  return (
    <div className="absolute inset-0">
      <PinnedStill />

      <svg ref={leader} aria-hidden data-visible="false" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible transition-opacity duration-200 data-[visible=false]:opacity-0">
        <path fill="none" stroke="var(--hud-line)" strokeWidth={1} />
        <circle r={1.5} fill="var(--text-1)" />
      </svg>

      <GlassPanel
        data-copy
        className="absolute inset-x-4 z-10 top-[10svh] focus-within:opacity-100! [&:focus-within_[data-reveal]]:transform-none! [&:focus-within_[data-reveal]]:opacity-100! md:inset-x-auto md:left-[6vw] md:top-1/2 md:w-[min(34vw,520px)] md:-translate-y-1/2"
      >
        <Eyebrow data-reveal index="08">
          The part
        </Eyebrow>
        <h2 id="object-title" data-reveal className="mt-4 text-h2 text-text-1">
          Hold it.
        </h2>
        <p data-reveal className="mt-5 max-w-[34ch] text-body text-text-2">
          96 grams of titanium where there were 412. <span className="[:root[data-mode=static]_&]:hidden">Drag to turn it. </span>Switch the material to see what the same
          design weighs, what it costs and how fast it ships.
        </p>
        <div data-reveal className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button href="#quote" onClick={quote}>
            Quote this part
          </Button>
          <Button href="#pricing" variant="secondary">
            Start building
          </Button>
        </div>
      </GlassPanel>

      <div ref={card} data-exit className="pointer-events-none absolute right-[4vw] top-[13svh] hidden md:block">
        <HudCluster window={[SPEC_IN, 1]} decorative={false} padding="px-5 py-4">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-[auto_auto_auto]">
            <div className="hidden md:block">
              <dt className="hud-label text-text-2">Mass</dt>
              <dd className="m-0 mt-2 flex items-end gap-1.5 font-mono text-[22px] font-medium leading-none text-text-1">
                <Roll ref={(el) => void (rolls.current[0] = el)} value={first.massG} int={2} />
                <span aria-hidden className="pb-[3px] font-mono text-[12px] text-text-2">g</span>
                <span ref={(el) => void (srs.current[0] = el)} className="sr-only">{`${first.massG} grams`}</span>
              </dd>
            </div>
            <div>
              <dt className="hud-label text-text-2">Unit price · qty 1</dt>
              <dd className="m-0 mt-2 flex items-end font-mono text-[22px] font-medium leading-none text-text-1">
                <Roll ref={(el) => void (rolls.current[1] = el)} value={first.unitPrice} int={3} dec={2} prefix="$" />
                <span ref={(el) => void (srs.current[1] = el)} className="sr-only">{`$${first.unitPrice.toFixed(2)}`}</span>
              </dd>
            </div>
            <div>
              <dt className="hud-label text-text-2">Lead time</dt>
              <dd className="m-0 mt-2 flex items-end gap-1.5 font-mono text-[22px] font-medium leading-none text-text-1">
                <Roll ref={(el) => void (rolls.current[2] = el)} value={first.leadDays} int={1} />
                <span aria-hidden className="pb-[3px] font-mono text-[12px] text-text-2">business days</span>
                <span ref={(el) => void (srs.current[2] = el)} className="sr-only">{`${first.leadDays} business days`}</span>
              </dd>
            </div>
          </dl>
        </HudCluster>
      </div>

      <div
        ref={slider}
        role="slider"
        tabIndex={0}
        aria-label="Rotate the part"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={signals.yawDeg}
        aria-valuetext={`${signals.yawDeg} degrees`}
        aria-orientation="horizontal"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onLostPointerCapture={onUp}
        onKeyDown={onSliderKey}
        onFocus={onSliderFocus}
        onBlur={onSliderBlur}
        className="absolute inset-x-0 top-0 h-[55svh] cursor-grab touch-pan-y select-none rounded-panel active:cursor-grabbing md:inset-x-auto md:left-[44vw] md:right-[4vw] md:top-[12svh] md:h-[66svh] [:root[data-mode=static]_&]:hidden"
      />

      <div data-controls className="absolute inset-x-4 bottom-[6svh] flex flex-col items-center gap-4 focus-within:opacity-100! md:inset-x-auto md:left-[64vw] md:-translate-x-1/2">
        <div
          ref={hint}
          aria-hidden
          data-done="false"
          className="hud-label flex items-center gap-2 text-text-2 transition-opacity duration-500 data-[done=true]:opacity-0 [:root[data-mode=static]_&]:hidden"
        >
          <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M5 1 1 5l4 4M17 1l4 4-4 4M1 5h20" />
          </svg>
          Drag to rotate
        </div>
        <span id="object-material-label" className="sr-only">
          Material
        </span>
        <span ref={live} aria-live="polite" className="sr-only" />
        <div
          ref={group}
          role="radiogroup"
          aria-labelledby="object-material-label"
          className="copy-panel relative isolate grid w-full grid-cols-3 p-1 md:w-[min(600px,46vw)]"
          style={{ '--i': 0 } as CSSProperties}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-1 left-1 -z-10 w-[calc((100%-0.5rem)/3)] translate-x-[calc(var(--i)*100%)] rounded-[12px] bg-[linear-gradient(180deg,rgb(255_126_51/0.2),rgb(255_106_26/0.08))] shadow-[inset_0_0_0_1px_rgb(255_126_51/0.5),0_0_24px_-8px_rgb(255_106_26/0.7)] transition-transform duration-500 ease-out-expo"
          />
          {SPEC.map((m, i) => (
            <button
              key={m.key}
              ref={(el) => void (radios.current[i] = el)}
              type="button"
              role="radio"
              aria-checked={i === 0}
              tabIndex={i === 0 ? 0 : -1}
              data-checked={i === 0 ? 'true' : 'false'}
              onClick={() => choose(i as MaterialIndex)}
              onKeyDown={onRadioKey}
              className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-[12px] px-3 py-2 text-center focus-visible:outline-offset-1"
            >
              <span className="text-ui text-text-2 transition-colors group-hover:text-text-1 group-data-[checked=true]:text-text-1">{m.name}</span>
              <span className="font-mono text-[11px] tracking-[0.04em] text-text-2">{m.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <BBoxBrackets bbox={signals.bbox} width={`${env.x.toFixed(1)} mm`} height={`${env.y.toFixed(1)} mm`} window={[SPEC_IN, 1]} progress={bracketP} className="max-md:hidden" />
    </div>
  );
}

/** Static mode: once the visitor picks a material, show that material's still (300 ms crossfade). */
function PinnedStill() {
  const mode = useStoryMode();
  const booted = useStoryStore((s) => s.booted);
  const entry = useStoryStore((s) => s.stills?.chapters.object);
  const pinned = usePartStore((s) => s.materialPinned);
  const material = usePartStore((s) => s.material);
  if (mode !== 'static' || !booted || !entry?.desktop.length) return null;
  const chosen = MATERIAL_KEYS.indexOf(material as (typeof MATERIAL_KEYS)[number]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {entry.desktop.map((file, n) => (
        <picture key={file} className="absolute inset-0 block transition-opacity duration-300" style={{ opacity: pinned && n === chosen ? 1 : 0 }}>
          {entry.mobile[n] && <source media="(max-width: 767px)" srcSet={`/strata/stills/${entry.mobile[n]}`} />}
          <img src={`/strata/stills/${file}`} alt="" decoding="async" className="h-full w-full object-cover" />
        </picture>
      ))}
    </div>
  );
}
