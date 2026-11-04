/**
 * "From thought to thing." as single-stroke filament paths, in mm.
 *
 * Glyph skeletons are drawn the Hershey Simplex way (one pen line per stroke, in natural pen order) on Inter Tight
 * 600's own metrics, measured from the font: advance widths, kerning, cap height and ascenders 728, x-height 546
 * with 553 / -11 overshoots, t at 676, i dot at 763, g descender -216. Horizontal positions follow the stems'
 * centrelines with the ink box pulled in slightly, as a lighter cut of the same family would; vertical extents put
 * the bead's outer edge on the font's. Design units are 1000 per em, y up, in each glyph's advance space. One
 * layout feeds both the SVG write-on and the 3D filament.
 *
 * World mapping: the headline lies on the build plate (xz), letter tops toward -z, reading along +x.
 */

export type Vec2 = readonly [number, number];

/** FDM bead: 2.0 mm wide, 1.2 mm per layer, three layers. */
export const BEAD = { width: 2, height: 1.2, layers: 3 } as const;
export const BEAD_TOP = BEAD.height * BEAD.layers;

type Seg = { c?: readonly [number, number, number, number]; x: number; y: number };
interface PenDef {
  kind: 'pen';
  x: number;
  y: number;
  segs: Seg[];
  closed: boolean;
}
interface DotDef {
  kind: 'dot';
  x: number;
  y: number;
  /** Outer radius in design units. */
  r: number;
}
type StrokeDef = PenDef | DotDef;
interface GlyphDef {
  adv: number;
  strokes: StrokeDef[];
}

/** Parses a tiny path language: M x y, L x y, C x1 y1 x2 y2 x y, Z (closed), D x y r (a printed dot). */
function parse(src: string): StrokeDef {
  const t = src.trim().split(/[\s,]+/);
  if (t[0] === 'D') return { kind: 'dot', x: +t[1], y: +t[2], r: +t[3] };
  const pen: PenDef = { kind: 'pen', x: +t[1], y: +t[2], segs: [], closed: false };
  let i = 3;
  while (i < t.length) {
    const cmd = t[i++];
    if (cmd === 'L') {
      pen.segs.push({ x: +t[i], y: +t[i + 1] });
      i += 2;
    } else if (cmd === 'C') {
      pen.segs.push({ c: [+t[i], +t[i + 1], +t[i + 2], +t[i + 3]], x: +t[i + 4], y: +t[i + 5] });
      i += 6;
    } else if (cmd === 'Z') {
      pen.closed = true;
    }
  }
  return pen;
}

const glyph = (adv: number, ...strokes: string[]): GlyphDef => ({ adv, strokes: strokes.map(parse) });

/** Half the 2 mm bead in design units at the desktop scale: centrelines sit this far inside the outline. */
const HALF = 41;
const BASE = HALF;
const XH = 546 - HALF;
const CAP = 728 - HALF;
const OVER_T = 553 - HALF;
const OVER_B = -11 + HALF;
const CAP_OUTLINE = 728;

const f = (v: number) => Math.round(v * 10) / 10;

/** An n-arch: springs from the left stem under the x-height, crowns left of centre, drops into the right stem. */
function arch(xl: number, xr: number) {
  const w = xr - xl;
  const spring = 412;
  const ax = xl + 0.47 * w;
  const drop = 372;
  return (
    `M ${xl} ${spring} C ${f(xl + 0.07 * w)} ${f(spring + 0.62 * (OVER_T - spring))} ${f(ax - 0.27 * w)} ${OVER_T} ${f(ax)} ${OVER_T} ` +
    `C ${f(ax + 0.33 * w)} ${OVER_T} ${xr} ${f(drop + 0.6 * (OVER_T - drop))} ${xr} ${drop} L ${xr} ${BASE}`
  );
}

/** u's bowl: the arch turned half a turn, from the top of the left stem round into the right stem. */
function bowl(xl: number, xr: number) {
  const w = xr - xl;
  const join = 546 - 412;
  const ax = xr - 0.47 * w;
  const rise = 546 - 372;
  return (
    `M ${xl} ${XH} L ${xl} ${rise} C ${xl} ${f(rise - 0.6 * (rise - OVER_B))} ${f(ax - 0.33 * w)} ${OVER_B} ${f(ax)} ${OVER_B} ` +
    `C ${f(ax + 0.27 * w)} ${OVER_B} ${f(xr - 0.07 * w)} ${f(join - 0.62 * (join - OVER_B))} ${xr} ${join}`
  );
}

/** A closed bowl (o, and g's open variant) with superellipse-like shoulders. */
function loop(cx: number, rx: number, k = 0.585) {
  const cy = (OVER_T + OVER_B) / 2;
  const ry = (OVER_T - OVER_B) / 2;
  const kx = f(k * rx);
  const ky = f(k * ry);
  return (
    `M ${cx} ${OVER_T} C ${f(cx - kx)} ${OVER_T} ${cx - rx} ${f(cy + ky)} ${cx - rx} ${cy} ` +
    `C ${cx - rx} ${f(cy - ky)} ${f(cx - kx)} ${OVER_B} ${cx} ${OVER_B} ` +
    `C ${f(cx + kx)} ${OVER_B} ${cx + rx} ${f(cy - ky)} ${cx + rx} ${cy} ` +
    `C ${cx + rx} ${f(cy + ky)} ${f(cx + kx)} ${OVER_T} ${cx} ${OVER_T} Z`
  );
}

const stem = (x: number, top = XH) => `M ${x} ${BASE} L ${x} ${top}`;

const GLYPHS: Record<string, GlyphDef> = {
  F: glyph(548, `M 114 ${BASE} L 114 ${CAP - 40} C 114 ${CAP - 18} 132 ${CAP} 154 ${CAP} L 458 ${CAP}`, 'M 114 337 L 408 337'),
  r: glyph(359, stem(108), `M 108 396 C 127 469 181 ${OVER_T} 250 ${OVER_T} C 272 ${OVER_T} 291 509 310 503`),
  o: glyph(571, loop(285.5, 200.5)),
  m: glyph(862, stem(108), arch(108, 431), arch(431, 753)),
  t: glyph(343, `M 136 ${676 - HALF} L 136 162 C 136 82 170 ${OVER_B + 10} 234 ${OVER_B + 10} C 251 ${OVER_B + 10} 266 43 281 47`, `M 67 ${XH} L 270 ${XH}`),
  h: glyph(577, stem(108, CAP), arch(108, 469)),
  u: glyph(571, bowl(108, 462), stem(462)),
  g: glyph(
    587,
    `M 479 402 C 453 474 386 ${OVER_T} 290 ${OVER_T} C 167 ${OVER_T} 85 419 85 271 C 85 123 167 ${OVER_B} 290 ${OVER_B} C 386 ${OVER_B} 453 68 479 140`,
    `M 479 ${XH} L 479 -32 C 479 -128 410 ${-216 + HALF} 292 ${-216 + HALF} C 212 ${-216 + HALF} 154 -150 121 -112`,
  ),
  i: glyph(223, 'D 111.5 701 62', `M 111.5 ${XH} L 111.5 ${BASE}`),
  n: glyph(574, stem(108), arch(108, 465)),
  '.': glyph(282, 'D 141 70 70'),
  ' ': glyph(211),
};
/** Inter Tight 600 kerning for the pairs in the headline. */
const KERN: Record<string, number> = { Fr: -8, ro: -22, to: -5, th: 11 };
/** Display tracking, as the DOM headline (-0.03 em). */
const TRACK = -30;

export interface PenStroke {
  kind: 'pen';
  /** Index of the glyph in the text (spaces count). */
  glyph: number;
  /** Start point and segments in mm, (x, z) on the plate; cubic segments carry two control points. */
  start: Vec2;
  segs: { c?: readonly [number, number, number, number]; to: Vec2 }[];
  closed: boolean;
  /** SVG path data in the same mm space (z is SVG y). */
  d: string;
  /** Arc length in mm. */
  length: number;
  end: Vec2;
}

export interface DotStroke {
  kind: 'dot';
  glyph: number;
  center: Vec2;
  /** Outer radius in mm (bead edge). */
  radius: number;
  start: Vec2;
  end: Vec2;
  length: number;
}

export type Stroke = PenStroke | DotStroke;

export interface StrokeLayout {
  name: 'desktop' | 'portrait';
  strokes: Stroke[];
  /** SVG viewBox in mm: x, y (= z), width, height. Padded for the glow. */
  viewBox: readonly [number, number, number, number];
  /** Ink extents in mm (outer bead edges). */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Cap height (outline) and the baseline z of each line, mm. */
  cap: number;
  baselines: number[];
  /** Total pen length in mm (dots count their circumference). */
  length: number;
  /** P: centre of the closing period at bead-top height (x, y, z) in mm. */
  period: readonly [number, number, number];
}

interface LineSpec {
  text: string;
  /** Baseline z in mm. */
  baseline: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

function glyphExtents(g: GlyphDef) {
  let min = Infinity;
  let max = -Infinity;
  for (const s of g.strokes) {
    if (s.kind === 'dot') {
      min = Math.min(min, s.x - s.r + HALF);
      max = Math.max(max, s.x + s.r - HALF);
      continue;
    }
    let px = s.x;
    min = Math.min(min, px);
    max = Math.max(max, px);
    for (const seg of s.segs) {
      if (seg.c) {
        for (let k = 1; k <= 16; k++) {
          const x = cubic1(px, seg.c[0], seg.c[2], seg.x, k / 16);
          min = Math.min(min, x);
          max = Math.max(max, x);
        }
      }
      min = Math.min(min, seg.x);
      max = Math.max(max, seg.x);
      px = seg.x;
    }
  }
  return { min, max };
}

function cubic1(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** Lays out one line in design units: glyph origins (advance space) and the centreline ink span. */
function setLine(text: string) {
  const origins: number[] = [];
  let pen = 0;
  let inkMin = Infinity;
  let inkMax = -Infinity;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const g = GLYPHS[ch];
    if (!g) throw new Error(`strokes: no glyph for "${ch}"`);
    if (i > 0) pen += (KERN[text[i - 1] + ch] ?? 0) + TRACK;
    origins.push(pen);
    if (g.strokes.length) {
      const ext = glyphExtents(g);
      inkMin = Math.min(inkMin, pen + ext.min);
      inkMax = Math.max(inkMax, pen + ext.max);
    }
    pen += g.adv;
  }
  return { origins, inkMin, inkMax };
}

function arcLength(start: Vec2, segs: PenStroke['segs']) {
  let len = 0;
  let [px, pz] = start;
  for (const s of segs) {
    if (s.c) {
      let qx = px;
      let qz = pz;
      for (let k = 1; k <= 48; k++) {
        const t = k / 48;
        const x = cubic1(px, s.c[0], s.c[2], s.to[0], t);
        const z = cubic1(pz, s.c[1], s.c[3], s.to[1], t);
        len += Math.hypot(x - qx, z - qz);
        qx = x;
        qz = z;
      }
    } else {
      len += Math.hypot(s.to[0] - px, s.to[1] - pz);
    }
    [px, pz] = s.to;
  }
  return len;
}

/**
 * Builds a layout: every line is scaled by the same mm-per-unit `scale`, centred on x = 0 (unless `left` is
 * given), with its baseline at `baseline` (z, mm). Letter tops point toward -z.
 */
function build(name: StrokeLayout['name'], lines: LineSpec[], scale: number): StrokeLayout {
  const strokes: Stroke[] = [];
  const bead = BEAD.width / 2;
  let glyphIndex = 0;
  let period: [number, number, number] = [0, BEAD_TOP, 0];
  for (const line of lines) {
    const set = setLine(line.text);
    const shift = -(set.inkMin + set.inkMax) / 2;
    const X = (x: number, ox: number) => r2((ox + x + shift) * scale);
    const Z = (y: number) => r2(line.baseline - y * scale);
    for (let i = 0; i < line.text.length; i++, glyphIndex++) {
      const ch = line.text[i];
      if (ch === ' ') continue;
      const ox = set.origins[i];
      for (const s of GLYPHS[ch].strokes) {
        if (s.kind === 'dot') {
          const center: Vec2 = [X(s.x, ox), Z(s.y)];
          const radius = r2(s.r * scale);
          strokes.push({ kind: 'dot', glyph: glyphIndex, center, radius, start: center, end: center, length: 0 });
          if (ch === '.') period = [center[0], BEAD_TOP, center[1]];
          continue;
        }
        const start: Vec2 = [X(s.x, ox), Z(s.y)];
        const segs = s.segs.map((g) => ({
          c: g.c ? ([X(g.c[0], ox), Z(g.c[1]), X(g.c[2], ox), Z(g.c[3])] as const) : undefined,
          to: [X(g.x, ox), Z(g.y)] as Vec2,
        }));
        let d = `M${start[0]} ${start[1]}`;
        for (const g of segs) d += g.c ? `C${g.c.join(' ')} ${g.to[0]} ${g.to[1]}` : `L${g.to[0]} ${g.to[1]}`;
        if (s.closed) d += 'Z';
        const length = arcLength(start, segs);
        strokes.push({
          kind: 'pen',
          glyph: glyphIndex,
          start,
          segs,
          closed: s.closed,
          d,
          length,
          end: segs.length ? segs[segs.length - 1].to : start,
        });
      }
    }
    glyphIndex++;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let length = 0;
  for (const s of strokes) {
    if (s.kind === 'dot') {
      s.length = 2 * Math.PI * Math.max(0.2, s.radius - bead);
      minX = Math.min(minX, s.center[0] - s.radius);
      maxX = Math.max(maxX, s.center[0] + s.radius);
      minZ = Math.min(minZ, s.center[1] - s.radius);
      maxZ = Math.max(maxZ, s.center[1] + s.radius);
    } else {
      for (const p of samplePen(s, 0.05, 4)) {
        minX = Math.min(minX, p[0] - bead);
        maxX = Math.max(maxX, p[0] + bead);
        minZ = Math.min(minZ, p[1] - bead);
        maxZ = Math.max(maxZ, p[1] + bead);
      }
    }
    length += s.length;
  }
  const pad = 6;
  const viewBox = [
    r2(minX - pad),
    r2(minZ - pad),
    r2(maxX - minX + 2 * pad),
    r2(maxZ - minZ + 2 * pad),
  ] as const;
  return {
    name,
    strokes,
    viewBox,
    bounds: { minX, maxX, minZ, maxZ },
    cap: r2(CAP_OUTLINE * scale),
    baselines: lines.map((l) => l.baseline),
    length,
    period,
  };
}

/** Scale that fits `text` between outer bead edges at x = -half..half. */
function fitScale(text: string, half: number) {
  const set = setLine(text);
  return (2 * half - BEAD.width) / (set.inkMax - set.inkMin);
}

const HEADLINE = 'From thought to thing.';
const desktopScale = fitScale(HEADLINE, 112);
const portraitScale = Math.min(fitScale('From thought', 64), fitScale('to thing.', 64));

/** One line, x -112..112, cap band centred on z = 0. */
export const desktop: StrokeLayout = build(
  'desktop',
  [{ text: HEADLINE, baseline: (CAP_OUTLINE * desktopScale) / 2 }],
  desktopScale,
);

/** Two centred lines, "From thought" / "to thing.", x -64..64. */
export const portrait: StrokeLayout = build(
  'portrait',
  [
    { text: 'From thought', baseline: -6 },
    { text: 'to thing.', baseline: 34 },
  ],
  portraitScale,
);

/** P on the desktop layout. */
export const PERIOD = desktop.period;

/**
 * Samples a pen stroke into a polyline (mm, (x, z)). Cubics are subdivided until the chord deviates less than
 * `tolerance` mm; no span is longer than `maxStep` mm.
 */
export function samplePen(s: PenStroke, tolerance: number, maxStep: number): Vec2[] {
  const out: Vec2[] = [s.start];
  let [px, pz] = s.start;
  for (const seg of s.segs) {
    const [tx, tz] = seg.to;
    if (!seg.c) {
      const n = Math.max(1, Math.ceil(Math.hypot(tx - px, tz - pz) / maxStep));
      for (let k = 1; k <= n; k++) out.push([px + ((tx - px) * k) / n, pz + ((tz - pz) * k) / n]);
    } else {
      const [ax, az, bx, bz] = seg.c;
      const flat = Math.max(
        Math.hypot(3 * ax - 2 * px - tx, 3 * az - 2 * pz - tz),
        Math.hypot(3 * bx - px - 2 * tx, 3 * bz - pz - 2 * tz),
      );
      const chord = Math.hypot(tx - px, tz - pz) + Math.hypot(ax - px, az - pz) + Math.hypot(bx - tx, bz - tz);
      const n = Math.max(2, Math.ceil(Math.sqrt(flat / (8 * tolerance))), Math.ceil(chord / 2 / maxStep));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        out.push([cubic1(px, ax, bx, tx, t), cubic1(pz, az, bz, tz, t)]);
      }
    }
    px = tx;
    pz = tz;
  }
  if (s.closed) out.pop();
  return out;
}

export interface WriteOnStroke {
  /** Start and duration in seconds, from page paint. */
  t: number;
  d: number;
}

export interface WriteOn {
  strokes: WriteOnStroke[];
  /** Molten dot motion: keyframes as [time s, distance along the travel path 0..1]. */
  dot: [number, number][];
  /** The dot's travel path (strokes joined by pen-up moves), SVG path data in mm. */
  travel: string;
  /** When the last stroke ends and when the dot comes to rest on the period. */
  drawEnd: number;
  settle: number;
}

/**
 * Write-on timing (STORYBOARD Ch0): the pen draws from `from` to `to` seconds at constant speed; pen-up moves
 * travel `travelSpeedup` times faster. The dot follows one combined path of strokes and travel moves.
 */
export function writeOn(layout: StrokeLayout, from = 0.4, to = 2.2, travelSpeedup = 2.6, settle = 2.6): WriteOn {
  const travels: number[] = [];
  let drawLen = 0;
  let travelWeight = 0;
  let prev: Vec2 | null = null;
  for (const s of layout.strokes) {
    const gap = prev ? Math.hypot(s.start[0] - prev[0], s.start[1] - prev[1]) : 0;
    travels.push(gap);
    travelWeight += gap / travelSpeedup;
    drawLen += s.length;
    prev = s.end;
  }
  const speed = (drawLen + travelWeight) / (to - from);
  const strokes: WriteOnStroke[] = [];
  const dot: [number, number][] = [];
  let t = from;
  let dist = 0;
  let travel = '';
  const pathLen = layout.strokes.reduce((a, s) => a + (s.kind === 'pen' ? s.length : 0), 0) + travels.reduce((a, b) => a + b, 0);
  layout.strokes.forEach((s, i) => {
    if (i > 0) {
      t += travels[i] / travelSpeedup / speed;
      dist += travels[i];
      travel += `L${s.start[0]} ${s.start[1]}`;
    } else {
      travel += `M${s.start[0]} ${s.start[1]}`;
    }
    dot.push([t, dist / pathLen]);
    const d = s.length / speed;
    strokes.push({ t: r3(t), d: r3(Math.max(d, 0.02)) });
    if (s.kind === 'pen') {
      travel += s.d.replace(/^M[^LCZ]+/, '').replace(/Z$/, `L${s.start[0]} ${s.start[1]}`);
      dist += s.length;
    }
    t += d;
    dot.push([t, dist / pathLen]);
  });
  return { strokes, dot, travel, drawEnd: t, settle };
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;
