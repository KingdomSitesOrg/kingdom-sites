import { MESH_MAX, MESH_MIN } from '@/strata/part/constants';
import { surfaceNets } from '@/strata/part/mesher';
import { mulberry32 } from '@/strata/part/samples';
import { createOptimizedField } from '@/strata/part/sdf';
import { Slicer } from '@/strata/part/slicer';
import type { GeometryRequest, GeometryResult, Loops } from './geometry';

type Line = { u: number; segs: number[] };

/** Even-odd hatch of closed loops: lines along `angle`, `spacing` apart, sorted by descending offset. */
function hatch(loops: Float32Array[], angle: number, spacing: number): Line[] {
  const dx = Math.cos(angle);
  const dz = Math.sin(angle);
  let umin = Infinity;
  let umax = -Infinity;
  for (const l of loops)
    for (let i = 0; i < l.length; i += 2) {
      const u = -l[i] * dz + l[i + 1] * dx;
      if (u < umin) umin = u;
      if (u > umax) umax = u;
    }
  const lines: Line[] = [];
  for (let k = Math.floor(umax / spacing); k * spacing > umin; k--) {
    const uk = k * spacing + spacing * 0.5;
    if (uk >= umax || uk <= umin) continue;
    const vs: number[] = [];
    for (const l of loops)
      for (let i = 0; i + 3 < l.length; i += 2) {
        const ua = -l[i] * dz + l[i + 1] * dx;
        const ub = -l[i + 2] * dz + l[i + 3] * dx;
        if ((ua - uk) * (ub - uk) >= 0) continue;
        const t = (uk - ua) / (ub - ua);
        const x = l[i] + (l[i + 2] - l[i]) * t;
        const z = l[i + 1] + (l[i + 3] - l[i + 1]) * t;
        vs.push(x * dx + z * dz);
      }
    if (vs.length < 2) continue;
    vs.sort((a, b) => a - b);
    const segs: number[] = [];
    for (let i = 0; i + 1 < vs.length; i += 2) if (vs[i + 1] - vs[i] > 0.05) segs.push(vs[i], vs[i + 1]);
    if (segs.length) lines.push({ u: uk, segs });
  }
  return lines;
}

function sectionLoops(slicer: Slicer, y: number): Loops {
  const s = slicer.slice(y);
  return { outer: s.outer, holes: s.holes };
}

/* ---- SLS: twelve nested sections, contour then hatch, as ribbons with a laser-time coordinate ---- */

const SLS_HEIGHTS = [3, 18, 3, 26, 3, 10, 34, 3, 22, 3, 14, 3];

function buildSls(slicer: Slicer) {
  const rand = mulberry32(31);
  const pos: number[] = [];
  const time: number[] = [];
  const index: number[] = [];
  const head: number[] = [];
  let T = 0;
  let px = NaN;
  let pz = NaN;
  const W = 0.36;
  const TRAVEL = 0.06;

  const moveTo = (x: number, z: number) => {
    if (!Number.isNaN(px)) T += Math.hypot(x - px, z - pz) * TRAVEL;
    head.push(x, z, T, 0);
    px = x;
    pz = z;
  };
  const lineTo = (x: number, z: number) => {
    const len = Math.hypot(x - px, z - pz);
    if (len < 1e-4) return;
    const nx = (-(z - pz) / len) * W;
    const nz = ((x - px) / len) * W;
    const b = pos.length / 2;
    pos.push(px + nx, pz + nz, px - nx, pz - nz, x + nx, z + nz, x - nx, z - nz);
    time.push(T, T, T + len, T + len);
    index.push(b, b + 2, b + 1, b + 2, b + 3, b + 1);
    T += len;
    head.push(x, z, T, 1);
    px = x;
    pz = z;
  };

  // Seeded placements on a 4 x 3 grid; scanned far-to-near so the laser ends its layer beside the camera target.
  const cells = Array.from({ length: 12 }, (_, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return { i, cx: -62 + col * 62 + (rand() - 0.5) * 12, cz: -70 + row * 66 + (rand() - 0.5) * 12, rot: rand() * Math.PI * 2 };
  });
  const finish = (c: { cx: number; cz: number }) => Math.hypot(c.cx - 30, c.cz + 10);
  cells.sort((a, b) => finish(b) - finish(a));
  for (const { i, cx, cz, rot } of cells) {
    const c = Math.cos(rot) * 0.5;
    const s = Math.sin(rot) * 0.5;
    const tx = (x: number, z: number) => cx + (x - 0) * c - z * s;
    const tz = (x: number, z: number) => cz + (x - 0) * s + z * c;
    const { outer, holes } = sectionLoops(slicer, SLS_HEIGHTS[i]);
    const loops = [...outer, ...holes].map((l) => {
      const out = new Float32Array(l.length);
      for (let k = 0; k < l.length; k += 2) {
        // centre the section on the part's x so every placement sits in its cell
        const x = l[k];
        const z = l[k + 1];
        out[k] = tx(x, z);
        out[k + 1] = tz(x, z);
      }
      return out;
    });
    for (const l of loops) {
      moveTo(l[0], l[1]);
      for (let k = 2; k < l.length; k += 2) lineTo(l[k], l[k + 1]);
    }
    const ang = rot + (i % 2 ? Math.PI / 4 : -Math.PI / 4);
    const lines = hatch(loops, ang, 0.9);
    const dx = Math.cos(ang);
    const dz = Math.sin(ang);
    lines.forEach((ln, li) => {
      const segs = li % 2 ? [...ln.segs].reverse() : ln.segs;
      for (let k = 0; k + 1 < segs.length; k += 2) {
        const va = segs[k];
        const vb = segs[k + 1];
        moveTo(-ln.u * dz + va * dx, ln.u * dx + va * dz);
        lineTo(-ln.u * dz + vb * dx, ln.u * dx + vb * dz);
      }
    });
  }
  return {
    position: new Float32Array(pos),
    time: new Float32Array(time),
    index: new Uint32Array(index),
    head: new Float32Array(head),
    total: T,
  };
}

/* ---- LPBF: one layer, hatched at 67 degrees in serpentine order ---- */

const LPBF_ANGLE = (67 * Math.PI) / 180;
const LPBF_SPACING = 0.55;

function buildLpbf(slicer: Slicer, y: number) {
  const { outer, holes } = sectionLoops(slicer, y);
  const loops = [...outer, ...holes];
  const lines = hatch(loops, LPBF_ANGLE, LPBF_SPACING);
  // RGBA per line: vmin, vmax, Tstart, direction
  const table = new Float32Array(lines.length * 4);
  const segs: number[] = [];
  const segStart = new Uint32Array(lines.length + 1);
  let T = 0;
  lines.forEach((ln, k) => {
    const vmin = ln.segs[0];
    const vmax = ln.segs[ln.segs.length - 1];
    const dir = k % 2 ? -1 : 1;
    table.set([vmin, vmax, T, dir], k * 4);
    segStart[k] = segs.length / 2;
    segs.push(...ln.segs);
    T += vmax - vmin + 0.8;
  });
  segStart[lines.length] = segs.length / 2;
  const flat = new Float32Array(loops.reduce((n, l) => n + l.length + 1, 1));
  let o = 0;
  flat[o++] = loops.length;
  for (const l of loops) {
    flat[o++] = l.length / 2;
    flat.set(l, o);
    o += l.length;
  }
  return {
    table,
    segs: new Float32Array(segs),
    segStart,
    count: lines.length,
    u0: lines.length ? lines[0].u : 0,
    spacing: LPBF_SPACING,
    angle: LPBF_ANGLE,
    total: T,
    loops: flat,
  };
}

/** Everything the cells need from the part's SDF, with the buffers to transfer. */
export function buildGeometry(req: GeometryRequest): { result: GeometryResult; transfer: ArrayBuffer[] } {
  const slicer = new Slicer(0.25);
  const sla = req.slaHeights.map((y) => sectionLoops(slicer, y));
  const sls = buildSls(slicer);
  const lpbf = buildLpbf(slicer, req.lpbfHeight);
  const nested = surfaceNets(createOptimizedField(), MESH_MIN, MESH_MAX, req.nestedRes).mesh;
  const transfer: ArrayBuffer[] = [];
  const add = (a: { buffer: ArrayBufferLike }) => transfer.push(a.buffer as ArrayBuffer);
  sla.forEach((s) => [...s.outer, ...s.holes].forEach(add));
  [sls.position, sls.time, sls.index, sls.head].forEach(add);
  [lpbf.table, lpbf.segs, lpbf.segStart, lpbf.loops].forEach(add);
  [nested.positions, nested.normals, nested.index].forEach(add);
  return { result: { sla, sls, lpbf, nested }, transfer };
}
