// Ch1 beats as pure functions of p, shared by the Scene (particles, dot) and the Overlay (DOM prompt).

export const PROMPT = 'a lightweight titanium bracket for a drone arm';

export const BEATS = {
  /** The dot glides into the caret; the input opens from it. */
  dotEnd: 0.12,
  typeStart: 0.12,
  typeEnd: 0.3,
  press: 0.3,
  chips: [0.305, 0.32, 0.335, 0.35],
  /** Swarm clock q = remap(p, swarmStart, swarmEnd). */
  swarmStart: 0.36,
  swarmEnd: 0.9,
  samples: 0.4,
  /** Input and chips fade out from 0.82, the copy over 0.88-0.96. */
  promptOut: 0.82,
  copyOut: 0.88,
  bbox: 0.88,
  confidence: 0.9,
} as const;

/** The burst sweeps the prompt left to right: a glyph at xNorm departs at q = SWEEP * xNorm (+ jitter). */
export const SWEEP = 0.16;
export const SWEEP_JITTER = 0.035;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const linearstep = (a: number, b: number, v: number) => clamp01((v - a) / (b - a));

export function swarmQ(p: number) {
  return (p - BEATS.swarmStart) / (BEATS.swarmEnd - BEATS.swarmStart);
}

/** Characters of the prompt typed at p. */
export function typedCount(p: number) {
  return Math.floor(linearstep(BEATS.typeStart, BEATS.typeEnd, p) * PROMPT.length + 1e-6);
}

/** Constraint chips landed at p (0..4). */
export function chipsLanded(p: number) {
  let n = 0;
  for (const c of BEATS.chips) if (p >= c) n++;
  return n;
}

/** DOM glyph at xNorm: heat 0..1 just before its particles leave, then its ink fades. */
export function glyphHeat(q: number, xNorm: number) {
  const d = SWEEP * xNorm;
  return linearstep(d - 0.07, d - 0.004, q);
}

export function glyphInk(q: number, xNorm: number) {
  const d = SWEEP * xNorm;
  return 1 - linearstep(d + 0.004, d + SWEEP_JITTER + 0.012, q);
}
