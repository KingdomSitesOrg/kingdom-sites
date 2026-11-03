// Pure beat maths for the chapter. Scene, HUD and static mode all read the same functions of p / raw.
import { facts } from '@/strata/story/facts';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
export const sineInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const expoInOut = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;

/** One handoff in raw units (desktop length 5). */
export const H = 0.25;

export const CELLS = ['sla', 'sls', 'lpbf'] as const;
export type CellId = (typeof CELLS)[number];
/** h3 and HUD swap at the darkest point of each truck. */
export const CELL_SWAP = [0.31, 0.63] as const;
/** Where the cell index buttons land. */
export const CELL_JUMP = [0.16, 0.48, 0.8] as const;
export const cellAt = (p: number) => (p < CELL_SWAP[0] ? 0 : p < CELL_SWAP[1] ? 1 : 2);

/** 0 .. 1 .. 0 over a truck window, 1 held across its middle third. */
function truck(p: number, a: number, b: number) {
  const w = (b - a) / 3;
  return smooth(range(p, a, a + w)) * (1 - smooth(range(p, b - w, b)));
}
/** 0 .. 1 .. 0 over either truck: the hall floor's lights come up as the cells go dark. */
export const truckAt = (p: number) => Math.max(truck(p, 0.285, 0.335), truck(p, 0.605, 0.655));
/** Exposure dips to 0.35 over both trucks: the travel reads as a camera move through a dark hall, never a black frame. */
export const exposureAt = (p: number) => 1 - 0.65 * Math.max(truck(p, 0.29, 0.33), truck(p, 0.61, 0.65));

/* ---------------- SLA ---------------- */

export const SLA_FLASH_AT = [-0.1, 0.05, 0.12, 0.19] as const;
export const SLA_FLASH_W = 0.02;
/** Section height (mm, part frame) cured by each flash. */
export const SLA_LAYER_Y = [6, 18, 30, 40.5] as const;
/** The FEP film: cured layers form here, so the plate underside sits this far above the last cured section. */
export const SLA_FEP_Y = 1;
export const SLA_PLATE_TOP = 128;

/** Flash envelope 0..1: sharp attack, short hold, soft afterglow. */
export function slaFlash(raw: number) {
  let v = 0;
  for (const t0 of SLA_FLASH_AT) {
    const u = (raw - t0) / SLA_FLASH_W;
    if (u < 0) continue;
    const e = u < 0.15 ? smooth(u / 0.15) : u < 1 ? 1 - 0.2 * (u - 0.15) : 0.83 * Math.exp(-(u - 1) * 4);
    if (e > v) v = e;
  }
  return v;
}

/** Index of the layer mask on the LCD: the latest flash that has started. */
export function slaMaskIndex(raw: number) {
  let k = 0;
  for (let i = 0; i < SLA_FLASH_AT.length; i++) if (raw >= SLA_FLASH_AT[i] - 0.012) k = i;
  return k;
}

const plateAt = (k: number) => SLA_LAYER_Y[k] + SLA_FEP_Y;

/** Build plate underside height (mm, cell frame). Steps up between flashes, then peels and rises. */
export function slaPlateY(raw: number) {
  const f = SLA_FLASH_AT;
  if (raw < f[0]) return plateAt(0) - 2 * (1 - smooth(range(raw, -0.3, f[0])));
  for (let k = 0; k < f.length - 1; k++) {
    const a = f[k] + SLA_FLASH_W;
    const b = f[k + 1] - 0.004;
    if (raw < a) return plateAt(k);
    if (raw < b) {
      const u = range(raw, a, b);
      // peel: lift past the next layer, then settle back onto it
      return plateAt(k) + (plateAt(k + 1) - plateAt(k)) * sineInOut(u) + 4 * Math.sin(Math.PI * u) ** 2;
    }
  }
  const last = plateAt(f.length - 1);
  const end = f[f.length - 1] + SLA_FLASH_W;
  if (raw < end) return last;
  return last + (SLA_PLATE_TOP - last) * sineInOut(range(raw, end + 0.004, 0.28));
}

/** Highest cured section (mm, part frame). */
export const slaBuiltY = (raw: number) => clamp(slaPlateY(raw) - SLA_FEP_Y, 0, 42);

export const slaLayer = (raw: number) =>
  clamp(Math.round(slaBuiltY(raw) / facts.layer.heightMM), 1, facts.layer.count);

/** Drips run once the part has cleared the resin. */
export const slaDrips = (p: number) => range(p, 0.215, 0.245);

/* ---------------- SLS ---------------- */

export const SLS_SCAN = [0.335, 0.458] as const;
export const SLS_BLADE = [0.462, 0.54] as const;
export const SLS_BLADE_X = [-185, 185] as const;
export const SLS_RISE = [0.536, 0.562] as const;
export const SLS_DISSOLVE = [0.546, 0.602] as const;
export const SLS_CAKE = { size: 300, depth: 120, lift: 104 } as const;

export const slsHead = (p: number) => range(p, SLS_SCAN[0], SLS_SCAN[1]);
export const slsBladeX = (p: number) => SLS_BLADE_X[0] + (SLS_BLADE_X[1] - SLS_BLADE_X[0]) * sineInOut(range(p, SLS_BLADE[0], SLS_BLADE[1]));
export const slsCakeY = (p: number) => SLS_CAKE.lift * sineInOut(range(p, SLS_RISE[0], SLS_RISE[1]));
/** Dissolve front in cake coordinates: 0 (top) down past the floor. */
export const slsFront = (p: number) => 6 - (SLS_CAKE.depth + 18) * range(p, SLS_DISSOLVE[0], SLS_DISSOLVE[1]) ** 0.85;

/* ---------------- LPBF ---------------- */

export const LPBF_SCAN = [0.656, 0.748] as const;
export const LPBF_RISE = [0.748, 0.776] as const;
export const LPBF_DRAIN = [0.776, 0.83] as const;
export const LPBF_COOL = [0.79, 0.862] as const;
export const LPBF_QA = [0.862, 0.9] as const;
export const LPBF_LAYER_Y = 2;
export const LPBF_TOP = 45;
/** Drained powder settles just under the build plate's top face. */
export const LPBF_FLOOR = -3;

/** Fraction of the macro layer's hatch path already melted. */
export const lpbfHead = (p: number) => range(p, LPBF_SCAN[0], LPBF_SCAN[1]);
/** Powder surface height (mm). */
export function lpbfSurface(p: number) {
  if (p < LPBF_RISE[0]) return LPBF_LAYER_Y;
  if (p < LPBF_DRAIN[0]) return LPBF_LAYER_Y + (LPBF_TOP - LPBF_LAYER_Y) * range(p, LPBF_RISE[0], LPBF_RISE[1]);
  return LPBF_FLOOR + (LPBF_TOP - LPBF_FLOOR) * (1 - sineInOut(range(p, LPBF_DRAIN[0], LPBF_DRAIN[1])));
}
export function lpbfPartTemp(p: number) {
  const { from: hot, to: cold } = facts.lpbf.partCoolC;
  const u = range(p, LPBF_COOL[0], LPBF_COOL[1]);
  return cold + (hot - cold) * (0.5 + 0.5 * Math.cos(Math.PI * u));
}
/** QA line height on the part (mm), -1 before the scan. */
export const lpbfScanY = (p: number) => (p < LPBF_QA[0] ? -1 : 44 * sineInOut(range(p, LPBF_QA[0], LPBF_QA[1])));
export const lpbfQA = (p: number) => p >= LPBF_QA[0];
/** 6 -> 7: outside the window the cell's key goes down and the cabinet takes Ch7's hall light (raw). */
export const lpbfOutro = (raw: number) => sineInOut(range(raw, 0.955, 1));
/** The grade eases into Ch7's over the pull-back (raw). */
export const lpbfGrade = (raw: number) => sineInOut(range(raw, 0.92, 1));
/** Chamber lights come up for the inspection and stay on for the pull-back. */
export const lpbfChamberLight = (p: number) => smooth(range(p, 0.84, 0.92));
