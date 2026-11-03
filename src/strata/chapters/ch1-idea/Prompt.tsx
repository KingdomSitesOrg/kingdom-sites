'use client';

import { useLayoutEffect, useRef } from 'react';
import { facts, isCapture, useChapter, useReducedMotion, useStoryMode, useStoryTick } from '@/strata/story';
import { IconSparkle } from '@/strata/ui';
import { BEATS, PROMPT, SWEEP, SWEEP_JITTER, glyphHeat, glyphInk, linearstep, swarmQ, typedCount } from './beats';
import { measurePrompt } from './ink';
import { signals } from './signals';
import './ch1.css';

export const CHIPS = [facts.part.material, 'Ø16 mm tube', '4 × M3 bolts', `${facts.load.forceN} N load`];
export const CHIP_COUNT = CHIPS.length;
const GLYPHS = Array.from(PROMPT);

/**
 * The prompt types itself, Generate fills, the constraint chips land, then the burst sweeps the line:
 * each glyph heats and gives its ink to the particles that leave from it. All of it is a pure function of p.
 */
export function Prompt() {
  const chapter = useChapter();
  const mode = useStoryMode();
  const reduced = useReducedMotion();
  const still = mode === 'static' || reduced;
  const shell = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const placeholder = useRef<HTMLSpanElement>(null);
  const state = useRef({ glyphs: null as Float32Array | null, lineLeft: 0, o: new Float32Array(GLYPHS.length).fill(-1), h: new Float32Array(GLYPHS.length).fill(-1), caretX: -1, caretO: -1, caretS: -1, blink: '', ph: -1, lastP: -1, lastStill: false });

  useLayoutEffect(() => {
    const root = chapter.root.current ?? shell.current?.closest<HTMLElement>('[data-overlay]')?.parentElement;
    const lineEl = line.current;
    const shellEl = shell.current;
    if (!root || !lineEl || !shellEl) return;
    const glyphEls = Array.from(lineEl.querySelectorAll<HTMLElement>('[data-g]'));
    const run = () => {
      const lay = measurePrompt(root, glyphEls);
      if (!lay) return;
      signals.caret[0] = lay.caret[0];
      signals.caret[1] = lay.caret[1];
      signals.textRect.set(lay.rect);
      signals.ink = lay.ink;
      signals.layoutVersion++;
      const rr = root.getBoundingClientRect();
      const sr = shellEl.getBoundingClientRect();
      const lr = lineEl.getBoundingClientRect();
      shellEl.style.setProperty('--cx', `${lay.caret[0] - (sr.left - rr.left)}px`);
      shellEl.style.setProperty('--cy', `${lay.caret[1] - (sr.top - rr.top)}px`);
      const st = state.current;
      st.glyphs = lay.glyphs;
      st.lineLeft = lr.left - rr.left;
      st.caretX = -1;
      st.lastP = -1;
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(root);
    ro.observe(shellEl);
    let alive = true;
    document.fonts?.ready.then(() => alive && run());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [chapter]);

  useStoryTick(() => {
    const lineEl = line.current;
    const st = state.current;
    if (!lineEl || !st.glyphs) return;
    const p = chapter.progress.current.p;
    if (p === st.lastP && still === st.lastStill) return;
    st.lastP = p;
    st.lastStill = still;
    const n = still ? GLYPHS.length : typedCount(p);
    const q = still ? -1 : swarmQ(p);
    const g = st.glyphs;
    const els = lineEl.children;
    for (let i = 0; i < GLYPHS.length; i++) {
      const el = els[i] as HTMLElement | undefined;
      if (!el) break;
      let o = i < n ? 1 : 0;
      let h = 0;
      if (o && q > -0.2) {
        h = glyphHeat(q, g[i * 3 + 2]);
        o = glyphInk(q, g[i * 3 + 2]);
      }
      o = Math.round(o * 40) / 40;
      h = Math.round(h * 40) / 40;
      if (o !== st.o[i]) {
        st.o[i] = o;
        el.style.opacity = String(o);
      }
      if (h !== st.h[i]) {
        st.h[i] = h;
        el.style.setProperty('--h', String(h));
      }
    }

    const c = caret.current;
    if (c) {
      const cleared = q > SWEEP + SWEEP_JITTER + 0.02;
      const at = n === 0 || cleared ? g[0] : g[(n - 1) * 3 + 1];
      const x = Math.round((at - st.lineLeft) * 2) / 2;
      const grow = still ? 0 : linearstep(BEATS.dotEnd - 0.016, BEATS.dotEnd + 0.004, p);
      const sweeping = q > -0.02 && !cleared;
      const o = still || sweeping ? 0 : grow * (1 - linearstep(BEATS.promptOut, BEATS.promptOut + 0.04, p));
      const blink = !isCapture() && (p < BEATS.typeStart + 0.004 || (p > BEATS.typeEnd + 0.004 && !sweeping)) ? '1' : '0';
      if (x !== st.caretX) {
        st.caretX = x;
        c.style.translate = `${x - 1}px 0`;
      }
      if (o !== st.caretO) {
        st.caretO = o;
        c.style.opacity = String(o);
      }
      const sc = Math.round((0.1 + 0.9 * grow) * 50) / 50;
      if (sc !== st.caretS) {
        st.caretS = sc;
        c.style.scale = `1 ${sc}`;
      }
      if (blink !== st.blink) {
        st.blink = blink;
        c.dataset.blink = blink;
      }
    }
    const ph = placeholder.current;
    if (ph) {
      const v = !still && n === 0 ? linearstep(BEATS.dotEnd - 0.005, BEATS.dotEnd + 0.01, p) : 0;
      if (v !== st.ph) {
        st.ph = v;
        ph.style.opacity = String(v);
      }
    }
  });

  return (
    <div className="ch1-prompt" data-prompt role="group" aria-label="Example prompt">
      <div className="ch1-glow" data-prompt-glow aria-hidden style={{ opacity: 0 }} />
      <div ref={shell} className="ch1-shell" data-prompt-shell>
        <svg className="ch1-trace" aria-hidden>
          <rect data-trace pathLength={1} strokeDasharray="1 1" />
        </svg>
        <p className="sr-only">Describe your part: {PROMPT}</p>
        <div ref={line} className="ch1-line" aria-hidden>
          {GLYPHS.map((ch, i) => (
            <span key={i} data-g className="ch1-g">
              {ch}
            </span>
          ))}
          <span ref={placeholder} className="ch1-placeholder" style={{ opacity: 0 }}>
            Describe a part
          </span>
          <span ref={caret} className="ch1-caret" style={{ opacity: 0 }} />
        </div>
        <div className="ch1-row">
          <ul className="ch1-chips" aria-label="Constraints">
            {CHIPS.map((c) => (
              <li key={c} className="ch1-chip" data-chip>
                {c}
              </li>
            ))}
          </ul>
          <button type="button" tabIndex={-1} aria-hidden className="ch1-generate" data-generate>
            <span className="ch1-generate-label" data-generate-base>
              <IconSparkle size={15} />
              Generate
            </span>
            <span className="ch1-generate-fill" data-generate-fill style={{ opacity: 0 }}>
              <span className="ch1-generate-label">
                <IconSparkle size={15} />
                Generate
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
