// A plausible structural reading (0..1) for the two designs, loaded at the collar and fixed at the bolts.
// Not FEA: it encodes where a von Mises plot of a cantilevered bracket lights up, then smooths it.
import {
  BODY,
  BODY_PLANES,
  BOSS,
  COLLAR,
  SCREW,
  STRUT_COUNT,
  STRUT_STRIDE,
  STRUTS,
  STRUT_R_SCALE,
  lastStrutT,
  sdBosses,
  sdCollarGroup,
  sdStrut,
} from './sdf';

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function strutRadius(si: number, t: number) {
  const r = STRUTS[si].r;
  return (r[0] * (2 * t - 1) * (t - 1) + r[1] * -4 * t * (t - 1) + r[2] * t * (2 * t - 1)) * STRUT_R_SCALE;
}

export function optimizedStress(positions: Float32Array): Float32Array {
  const n = positions.length / 3;
  const out = new Float32Array(n);
  const strutBest = new Float64Array(STRUTS.length);
  const strutT = new Float64Array(STRUTS.length);
  for (let v = 0; v < n; v++) {
    const x = positions[v * 3],
      y = positions[v * 3 + 1],
      z = Math.abs(positions[v * 3 + 2]);
    for (let si = 0; si < STRUT_COUNT; si++) {
      strutBest[si] = sdStrut(x, y, z, si * STRUT_STRIDE);
      strutT[si] = lastStrutT();
    }
    const dCollar = sdCollarGroup(x, y, z);
    const dBoss = sdBosses(x, y, z);
    let d1 = Math.min(dCollar, dBoss),
      d2 = 1e9;
    for (let s = 0; s < STRUTS.length; s++) {
      const d = strutBest[s];
      if (d < d1) {
        d2 = d1;
        d1 = d;
      } else if (d < d2) d2 = d;
    }
    // soft blend of every element's own stress level by proximity
    let wsum = 0,
      ssum = 0;
    const add = (d: number, s: number) => {
      const w = Math.exp(-(d - d1) / 1.2);
      wsum += w;
      ssum += w * s;
    };
    for (let s = 0; s < STRUTS.length; s++) {
      if (strutBest[s] > d1 + 6) continue;
      const r = strutRadius(s, strutT[s]);
      const level = Math.pow(STRUTS[s].load, 1.6) * Math.pow(3.1 / r, 2) * 0.85;
      add(strutBest[s], level);
    }
    // collar: hot where the struts land and around the clamp, cool at the open end
    const landing = Math.exp(-Math.max(0, x - (COLLAR.x0 + 2)) / 6);
    const clamp = Math.exp(-((x - SCREW.x) ** 2 + (y - SCREW.y) ** 2) / 40) * 0.45;
    add(dCollar, 0.1 + 0.62 * landing + clamp);
    // bosses: quiet except where the bolt load spreads into the struts
    add(dBoss, 0.16 + 0.25 * smoothstep(BOSS.top - 3, BOSS.top + 2, y));
    let s = ssum / wsum;
    // stress concentration where two members meet
    s += 0.32 * Math.exp(-(d2 - d1) / 1.6) * smoothstep(-1, 1, -d1 + 0.5);
    out[v] = s;
  }
  return out;
}

export function solidStress(positions: Float32Array): Float32Array {
  const n = positions.length / 3;
  const out = new Float32Array(n);
  const nTop = BODY_PLANES.N_TOP;
  const nUnder = BODY_PLANES.N_UNDER;
  for (let v = 0; v < n; v++) {
    const x = positions[v * 3],
      y = positions[v * 3 + 1],
      z = positions[v * 3 + 2];
    const dTop = (x - BODY.topA[0]) * nTop[0] + (y - BODY.topA[1]) * nTop[1];
    const dUnder = (x - BODY.underA[0]) * nUnder[0] + (y - BODY.underA[1]) * nUnder[1];
    // bending in a cantilever grows towards the root; fibres far from the neutral axis carry it
    const root = smoothstep(-40, 8, x) * (1 - smoothstep(20, 30, x));
    let s = 0.08;
    s += 0.55 * root * (1 - smoothstep(0, 7, -dTop));
    s += 0.6 * root * (1 - smoothstep(0, 6, -dUnder));
    // re-entrant corner where the underside meets the flange
    const corner = Math.hypot(x - BODY.underA[0], y - 1.5);
    s += 0.75 * Math.exp(-corner / 5);
    // the collar neck where the tube leaves the block
    const neck = Math.hypot(Math.hypot(y - COLLAR.y, z) - COLLAR.rOuter, x - BODY.back);
    s += 0.7 * Math.exp(-neck / 5);
    // bolt bosses and clamp
    for (const bx of BOSS.x) {
      const q = Math.hypot(x - bx, Math.abs(z) - BOSS.z);
      s += 0.25 * Math.exp(-Math.abs(q - BOSS.hole) / 2.5) * (1 - smoothstep(4, 12, y));
    }
    s += 0.3 * Math.exp(-((x - SCREW.x) ** 2 + (y - SCREW.y) ** 2) / 40);
    out[v] = s;
  }
  return out;
}

/** Umbrella smoothing over the triangle graph, then a robust 0..1 normalisation. */
export function smoothAndNormalise(
  values: Float32Array,
  index: Uint32Array,
  iterations = 8,
  contrast = 1.25,
): Float32Array {
  const n = values.length;
  let a: Float32Array = values;
  let b: Float32Array = new Float32Array(n);
  const cnt = new Float32Array(n);
  for (let it = 0; it < iterations; it++) {
    b.fill(0);
    cnt.fill(0);
    for (let t = 0; t < index.length; t += 3) {
      const i = index[t],
        j = index[t + 1],
        k = index[t + 2];
      b[i] += a[j] + a[k];
      b[j] += a[i] + a[k];
      b[k] += a[i] + a[j];
      cnt[i] += 2;
      cnt[j] += 2;
      cnt[k] += 2;
    }
    for (let i = 0; i < n; i++) b[i] = cnt[i] ? a[i] * 0.4 + (b[i] / cnt[i]) * 0.6 : a[i];
    const t = a;
    a = b;
    b = t === values ? new Float32Array(n) : t;
  }
  const sorted = Float32Array.from(a).sort();
  const lo = sorted[Math.floor(n * 0.01)];
  const hi = sorted[Math.floor(n * 0.995)];
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.pow(Math.min(1, Math.max(0, (a[i] - lo) / (hi - lo || 1))), contrast);
  return out;
}
