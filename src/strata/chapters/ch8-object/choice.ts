import { facts, isCapture, leadDays, partStore, quoteMaterials, unitPrice, type QuoteMaterial } from '@/strata/story';
import { signals } from './signals';

/** Switcher order: titanium, carbon nylon, clear resin. */
export const MATERIAL_KEYS = ['titanium', 'carbonNylon', 'clearResin'] as const satisfies readonly QuoteMaterial[];
export type MaterialIndex = 0 | 1 | 2;

/** The spec card at quantity 1 (STORYBOARD Ch8 HUD): every number from facts.ts and quote.ts. */
export const SPEC = MATERIAL_KEYS.map((key) => {
  const m = quoteMaterials[key];
  return {
    key,
    name: m.name,
    sub: `${m.spec} · ${m.process.replace(/^Resin /, '')}`,
    massG: facts.part.massByMaterialG[key],
    unitPrice: unitPrice('bracket', key, 1),
    leadDays: leadDays('bracket', key, 1),
  };
});

/** Scroll auto-switch (STORYBOARD Ch8): titanium, scrubbed swaps at 0.42-0.48 and 0.69-0.75. */
const AUTO: readonly [number, number, MaterialIndex, MaterialIndex][] = [
  [0.42, 0.48, 0, 1],
  [0.69, 0.75, 1, 2],
];

export interface SwapState {
  from: MaterialIndex;
  to: MaterialIndex;
  /** 0 = all `from`, 1 = all `to`. */
  k: number;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const power2InOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

/** Swap state for this progress. Pure for the scroll schedule; time-based for a visitor choice. */
export function swapAt(p: number, time: number, out: SwapState): SwapState {
  const pinned = partStore.getState().materialPinned && !isCapture();
  if (pinned) {
    const t = Math.min(1, Math.max(0, (time - signals.swapStart) / 0.7));
    out.from = signals.swapFrom as MaterialIndex;
    out.to = signals.swapTo as MaterialIndex;
    out.k = power2InOut(t);
    return out;
  }
  out.from = 0;
  out.to = 0;
  out.k = 0;
  for (const [a, b, from, to] of AUTO) {
    if (p < a) break;
    out.from = from;
    out.to = to;
    out.k = p >= b ? 1 : smooth((p - a) / (b - a));
  }
  return out;
}

/** The material the HUD and the switcher show: the incoming one once the band passes half way. */
export const shownOf = (s: SwapState): MaterialIndex => (s.k < 0.5 ? s.from : s.to);

/** A visitor choice: pin the material and start a 700 ms scan from what is on screen now. */
export function chooseMaterial(index: MaterialIndex, current: MaterialIndex, time: number) {
  if (isCapture()) return;
  signals.swapFrom = current;
  signals.swapTo = index;
  signals.swapStart = index === current ? -1e9 : time;
  signals.lastInput = time;
  partStore.getState().pinMaterial(MATERIAL_KEYS[index]);
}
