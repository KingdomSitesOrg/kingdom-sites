// GLSL twin of sdf.ts, generated from the same constants and strut table so the maths match exactly.
import {
  BODY,
  BODY_PLANES,
  BOSS,
  COLLAR,
  CUT_K,
  EAR,
  EAR_K,
  ENVELOPE,
  FLOOR_K,
  ERODE,
  FLANGE,
  GYROID,
  RIM,
  SCREW,
  SLOT,
  STR,
  STRUT_COUNT,
  STRUT_STRIDE,
} from './sdf';

const f = (v: number) => {
  const s = Number(v.toPrecision(9)).toString();
  return /[.e]/.test(s) ? s : `${s}.0`;
};
const v3 = (a: number, b: number, c: number) => `vec3(${f(a)}, ${f(b)}, ${f(c)})`;

function strutCode(): string {
  const out: string[] = [];
  for (let si = 0; si < STRUT_COUNT; si++) {
    const o = si * STRUT_STRIDE;
    const S = (i: number) => f(STR[o + i]);
    // skipping a strut that cannot reach d + k leaves smin unchanged, so this bound is exact
    out.push(`  if (length(q - ${v3(STR[o + 16], STR[o + 17], STR[o + 18])}) - ${S(19)} < d + ${S(15)})`);
    out.push(
      `    d = pt_smin(d, pt_strut(q, ${v3(STR[o], STR[o + 1], STR[o + 2])}, ${v3(STR[o + 3], STR[o + 4], STR[o + 5])}, ${v3(STR[o + 6], STR[o + 7], STR[o + 8])}, ${S(9)}, ${S(10)}, ${S(11)}, ${v3(STR[o + 12], STR[o + 13], STR[o + 14])}), ${S(15)});`,
    );
  }
  return out.join('\n');
}

const P = BODY_PLANES;
const collarHalf = (COLLAR.x1 - COLLAR.x0) / 2;
const flangeCx = (FLANGE.x0 + FLANGE.x1) / 2;
const flangeHx = (FLANGE.x1 - FLANGE.x0) / 2;

/**
 * GLSL (ES 3.0 / WebGL2) for the bracket, in millimetres. Paste it into a fragment shader and call:
 *   float sdSolid(vec3 p)                            the AI's first, chunky design
 *   float sdOptimized(vec3 p)                        the topology-optimized part
 *   float sdGyroid(vec3 p, float cell, float wall)   gyroid sheet (approximate distance)
 *   float sdInfill(vec3 p)                           gyroid inside the optimized part, under a 1.2 mm skin
 *   float sdPart(vec3 p, float t)                    erosion morph, t = 0 solid -> t = 1 optimized
 *   float sdPartBounds(vec3 p)                       box around the part, for early-out
 * Helpers are prefixed pt_. sdPart and sdGyroid are not exact distances: march with a step factor of about 0.6.
 */
export const PART_GLSL = /* glsl */ `
// ---- STRATA bracket SDF (mm, y-up, base on y = 0) ----
float pt_smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
float pt_smax(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * k * 0.25;
}
float pt_roundCyl(float radial, float axial, float r, float hh, float rr) {
  vec2 w = vec2(radial - r + rr, abs(axial) - hh + rr);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - rr;
}
float pt_strut(vec3 pos, vec3 A, vec3 a, vec3 b, float kk, float kx, float aa2, vec3 r) {
  vec3 d = A - pos;
  float ky = kk * (aa2 + dot(d, b)) / 3.0;
  float kz = kk * dot(d, a);
  float p = ky - kx * kx;
  float q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
  float h = q * q + 4.0 * p * p * p;
  float t;
  float dist2;
  if (h >= 0.0) {
    h = sqrt(h);
    vec2 x = (vec2(h, -h) - q) / 2.0;
    vec2 uv = sign(x) * pow(abs(x), vec2(1.0 / 3.0));
    t = clamp(uv.x + uv.y - kx, 0.0, 1.0);
    vec3 e = d + (2.0 * a + b * t) * t;
    dist2 = dot(e, e);
  } else {
    float z = sqrt(-p);
    float v = acos(clamp(q / (p * z * 2.0), -1.0, 1.0)) / 3.0;
    float m = cos(v);
    float n = sin(v) * 1.732050808;
    vec2 tt = clamp(vec2(m + m, -n - m) * z - kx, 0.0, 1.0);
    vec3 e0 = d + (2.0 * a + b * tt.x) * tt.x;
    vec3 e1 = d + (2.0 * a + b * tt.y) * tt.y;
    float d0 = dot(e0, e0), d1 = dot(e1, e1);
    t = d0 <= d1 ? tt.x : tt.y;
    dist2 = min(d0, d1);
  }
  float rad = r.x * (2.0 * t - 1.0) * (t - 1.0) - 4.0 * r.y * t * (t - 1.0) + r.z * t * (2.0 * t - 1.0);
  return sqrt(dist2) - rad;
}

float pt_collarGroup(vec3 q, bool rim) {
  float radial = length(vec2(q.y - ${f(COLLAR.y)}, q.z));
  float d = pt_roundCyl(radial, q.x - ${f(COLLAR.x0 + collarHalf)}, ${f(COLLAR.rOuter)}, ${f(collarHalf)}, ${f(COLLAR.round)});
  if (rim) d = pt_smin(d, length(vec2(radial - ${f(RIM.major)}, q.x - ${f(RIM.x)})) - ${f(RIM.minor)}, 2.2);
  float ear = pt_roundCyl(length(vec2(q.x - ${f(EAR.x)}, q.y - ${f(EAR.y)})), q.z, ${f(EAR.r)}, ${f(EAR.halfZ)}, ${f(EAR.round)});
  return pt_smin(d, ear, ${f(EAR_K)});
}

float pt_bosses(vec3 q) {
  float hh = ${f(BOSS.top / 2 + 0.5)};
  float ay = q.y - ${f(BOSS.top / 2 - 0.5)};
  float d0 = pt_roundCyl(length(vec2(q.x - ${f(BOSS.x[0])}, q.z - ${f(BOSS.z)})), ay, ${f(BOSS.r)}, hh, ${f(BOSS.round)});
  float d1 = pt_roundCyl(length(vec2(q.x - ${f(BOSS.x[1])}, q.z - ${f(BOSS.z)})), ay, ${f(BOSS.r)}, hh, ${f(BOSS.round)});
  return min(d0, d1);
}

float pt_cuts(vec3 p) {
  float radial = length(vec2(p.y - ${f(COLLAR.y)}, p.z));
  float bore = pt_smin(pt_smax(radial - ${f(COLLAR.rInner)}, ${f(COLLAR.stopX)} - p.x, 0.8), radial - ${f(COLLAR.rStop)}, 0.8);
  float sx = max(max(${f(SLOT.x0)} - p.x, abs(p.z) - ${f(SLOT.half)}), p.y - ${f(SLOT.yTop)});
  float relief = max(length(vec2(p.x - ${f(SLOT.x0)}, p.z)) - ${f(SLOT.relief)}, p.y - ${f(SLOT.yTop)});
  float slot = min(sx, relief);
  float sq = length(vec2(p.x - ${f(SCREW.x)}, p.y - ${f(SCREW.y)}));
  float screw = sq - ${f(SCREW.r)};
  screw = min(screw, max(sq - ${f(SCREW.cbR)}, ${f(SCREW.cbZ)} - p.z));
  float hx = abs(p.x - ${f(SCREW.x)});
  float hy = abs(p.y - ${f(SCREW.y)});
  float hex = max(hx * 0.866025 + hy * 0.5, hy) - ${f(SCREW.nutR * 0.866025)};
  screw = min(screw, max(hex, p.z - ${f(SCREW.nutZ)}));
  float az = abs(p.z);
  float bolts = 1e9;
  for (int i = 0; i < 2; i++) {
    float bx = i == 0 ? ${f(BOSS.x[0])} : ${f(BOSS.x[1])};
    float qd = length(vec2(p.x - bx, az - ${f(BOSS.z)}));
    bolts = min(bolts, min(qd - ${f(BOSS.hole)}, pt_smax(qd - ${f(BOSS.keepOut)}, ${f(BOSS.top)} - p.y, 1.6)));
  }
  return min(min(bore, slot), min(screw, bolts));
}

float pt_applyCuts(float d, vec3 p) {
  d = pt_smax(d, -pt_cuts(p), ${f(CUT_K)});
  vec3 e = vec3(abs(p.x), p.y, abs(p.z)) - ${v3(ENVELOPE.x, ENVELOPE.y, ENVELOPE.z)};
  d = pt_smax(d, max(e.x, max(e.y, e.z)), ${f(ENVELOPE.k)});
  return pt_smax(d, -p.y, ${f(FLOOR_K)});
}

float pt_body(vec3 q) {
  float dFront = ${f(BODY.front)} - q.x;
  float dTop = (q.x - ${f(BODY.topA[0])}) * ${f(P.N_TOP[0])} + (q.y - ${f(BODY.topA[1])}) * ${f(P.N_TOP[1])};
  float dUnder = (q.x - ${f(BODY.underA[0])}) * ${f(P.N_UNDER[0])} + (q.y - ${f(BODY.underA[1])}) * ${f(P.N_UNDER[1])};
  float dBack = q.x - ${f(BODY.back)};
  float dCap = q.y - ${f(BODY.top)};
  float dSide = (q.z + ${f(P.SIDE_S)} * q.y - ${f(BODY.side)}) * ${f(P.SIDE_N)};
  float k = 1.4;
  float d = pt_smax(-q.y, dFront, k);
  d = pt_smax(d, dTop, k);
  d = pt_smax(d, dUnder, k);
  d = pt_smax(d, dBack, k);
  d = pt_smax(d, dCap, k);
  d = pt_smax(d, dSide, k);
  d = pt_smax(d, (dFront + dTop) * ${f(P.CH_FRONT)} + ${f(BODY.chamfer[0])}, k);
  d = pt_smax(d, (dSide + dTop) * ${f(P.CH_SIDE)} + ${f(BODY.chamfer[1])}, k);
  d = pt_smax(d, (dSide + dUnder) * ${f(P.CH_UNDER)} + ${f(BODY.chamfer[2])}, k);
  return d;
}

float pt_flange(vec3 q) {
  vec2 c = vec2(abs(q.x - ${f(flangeCx)}) - ${f(flangeHx - FLANGE.corner)}, q.z - ${f(FLANGE.z - FLANGE.corner)});
  float d2 = min(max(c.x, c.y), 0.0) + length(max(c, 0.0)) - ${f(FLANGE.corner)};
  vec2 w = vec2(d2 + ${f(FLANGE.round)}, abs(q.y - ${f(FLANGE.t / 2)}) - ${f(FLANGE.t / 2 - FLANGE.round)});
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - ${f(FLANGE.round)};
}

float sdSolid(vec3 p) {
  vec3 q = vec3(p.xy, abs(p.z));
  float d = pt_smin(pt_flange(q), pt_body(q), 4.0);
  d = pt_smin(d, pt_collarGroup(q, false), 3.0);
  d = min(d, pt_bosses(q));
  return pt_applyCuts(d, p);
}

float sdOptimized(vec3 p) {
  vec3 q = vec3(p.xy, abs(p.z));
  float d = min(pt_collarGroup(q, true), pt_bosses(q));
${strutCode()}
  return pt_applyCuts(d, p);
}

float sdGyroid(vec3 p, float cell, float wall) {
  float k = ${f(2 * Math.PI)} / cell;
  vec3 s = sin(k * p);
  vec3 c = cos(k * p);
  float g = s.x * c.y + s.y * c.z + s.z * c.x;
  return abs(g) / (k * 1.2) - wall * 0.5;
}

float sdInfill(vec3 p) {
  return max(sdGyroid(p, ${f(GYROID.cell)}, ${f(GYROID.wall)}), sdOptimized(p) + ${f(GYROID.shell)});
}

float pt_hash(ivec3 i) {
  uint h = (uint(i.x) * 0x8da6b343u) ^ (uint(i.y) * 0xd8163841u) ^ (uint(i.z) * 0xcb1ab31fu);
  h = (h ^ (h >> 16u)) * 0x7feb352du;
  h = (h ^ (h >> 15u)) * 0x846ca68bu;
  h = h ^ (h >> 16u);
  return float(h) / 4294967295.0 * 2.0 - 1.0;
}
float pt_noise(vec3 x) {
  vec3 fl = floor(x);
  ivec3 i = ivec3(fl);
  vec3 fr = x - fl;
  vec3 u = fr * fr * fr * (fr * (fr * 6.0 - 15.0) + 10.0);
  float x00 = mix(pt_hash(i), pt_hash(i + ivec3(1, 0, 0)), u.x);
  float x10 = mix(pt_hash(i + ivec3(0, 1, 0)), pt_hash(i + ivec3(1, 1, 0)), u.x);
  float x01 = mix(pt_hash(i + ivec3(0, 0, 1)), pt_hash(i + ivec3(1, 0, 1)), u.x);
  float x11 = mix(pt_hash(i + ivec3(0, 1, 1)), pt_hash(i + ivec3(1, 1, 1)), u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
}

float sdPart(vec3 p, float t) {
  float e = clamp(t, 0.0, 1.0);
  float dOpt = sdOptimized(p);
  if (e >= 1.0) return dOpt;
  float ds = sdSolid(p);
  float space = ds - e * max(ds - dOpt, 0.0);
  float n = ${f(ERODE.coarse)} * pt_noise(p * ${f(ERODE.coarseFreq)})
          + ${f(ERODE.fine)} * pt_noise(vec3(p.x * ${f(ERODE.fineFreq)} + 17.3, p.y * ${f(ERODE.fineFreq)}, p.z * ${f(ERODE.fineFreq)} - 9.1));
  float u = 1.0 - e;
  float reach = ${f(ERODE.low)} * u + ${f(ERODE.reach - ERODE.low)} * pow(u, ${f(ERODE.curve)}) + ${f(ERODE.noise)} * u * n;
  return pt_smax(space, dOpt - reach, ${f(ERODE.blend)} * (1.0 - e) + 0.001);
}

float sdPartBounds(vec3 p) {
  vec3 q = abs(p - vec3(0.0, 21.0, 0.0)) - vec3(45.0, 22.0, 21.0);
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
`;

export const PART_GLSL_USAGE = `#include-free: prepend PART_GLSL to a WebGL2 fragment shader. Units are millimetres
(the story world is already mm; in the lab divide by PART_SCALE). sdSolid/sdOptimized/sdInfill are Lipschitz-1 except near the
gyroid; sdPart adds a noisy erosion front, so march with a step factor of ~0.6 and 96-160 steps.`;

