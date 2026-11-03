// Quadric-error edge-collapse decimation (Garland & Heckbert) for a closed, indexed triangle mesh.
// Used once to turn a mid-resolution solid into the faceted low-poly stage.

type Entry = { cost: number; a: number; b: number; sa: number; sb: number; x: number; y: number; z: number };

class Heap {
  private items: Entry[] = [];
  get size() {
    return this.items.length;
  }
  push(e: Entry) {
    const it = this.items;
    it.push(e);
    let i = it.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (it[p].cost <= e.cost) break;
      it[i] = it[p];
      i = p;
    }
    it[i] = e;
  }
  pop(): Entry | undefined {
    const it = this.items;
    if (!it.length) return undefined;
    const top = it[0];
    const last = it.pop()!;
    if (it.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= it.length) break;
        const r = l + 1;
        const c = r < it.length && it[r].cost < it[l].cost ? r : l;
        if (it[c].cost >= last.cost) break;
        it[i] = it[c];
        i = c;
      }
      it[i] = last;
    }
    return top;
  }
}

export function decimate(
  positions: Float32Array,
  index: Uint32Array,
  targetTris: number,
): { positions: Float32Array; index: Uint32Array } {
  const nV = positions.length / 3;
  const nF = index.length / 3;
  const V = Float64Array.from(positions);
  const F = Int32Array.from(index);
  const alive = new Uint8Array(nF).fill(1);
  const stamp = new Int32Array(nV);
  const vf: number[][] = Array.from({ length: nV }, () => []);
  for (let f = 0; f < nF; f++) for (let c = 0; c < 3; c++) vf[F[f * 3 + c]].push(f);

  const Q = new Float64Array(nV * 10);
  for (let f = 0; f < nF; f++) {
    const a = F[f * 3] * 3,
      b = F[f * 3 + 1] * 3,
      c = F[f * 3 + 2] * 3;
    const ux = V[b] - V[a],
      uy = V[b + 1] - V[a + 1],
      uz = V[b + 2] - V[a + 2];
    const vx = V[c] - V[a],
      vy = V[c + 1] - V[a + 1],
      vz = V[c + 2] - V[a + 2];
    let nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len < 1e-12) continue;
    const area = len * 0.5;
    nx /= len;
    ny /= len;
    nz /= len;
    const d = -(nx * V[a] + ny * V[a + 1] + nz * V[a + 2]);
    const k = [nx * nx, nx * ny, nx * nz, nx * d, ny * ny, ny * nz, ny * d, nz * nz, nz * d, d * d];
    for (let cc = 0; cc < 3; cc++) {
      const o = F[f * 3 + cc] * 10;
      for (let i = 0; i < 10; i++) Q[o + i] += k[i] * area;
    }
  }

  const q = new Float64Array(10);
  const err = (x: number, y: number, z: number) =>
    q[0] * x * x + 2 * q[1] * x * y + 2 * q[2] * x * z + 2 * q[3] * x + q[4] * y * y + 2 * q[5] * y * z + 2 * q[6] * y +
    q[7] * z * z + 2 * q[8] * z + q[9];

  const heap = new Heap();
  const push = (a: number, b: number) => {
    for (let i = 0; i < 10; i++) q[i] = Q[a * 10 + i] + Q[b * 10 + i];
    const ax = V[a * 3],
      ay = V[a * 3 + 1],
      az = V[a * 3 + 2];
    const bx = V[b * 3],
      by = V[b * 3 + 1],
      bz = V[b * 3 + 2];
    const mx = (ax + bx) / 2,
      my = (ay + by) / 2,
      mz = (az + bz) / 2;
    // solve the 3x3 system for the optimal point; fall back to the best of a, b and the midpoint
    const a11 = q[0], a12 = q[1], a13 = q[2], a22 = q[4], a23 = q[5], a33 = q[7];
    const det = a11 * (a22 * a33 - a23 * a23) - a12 * (a12 * a33 - a23 * a13) + a13 * (a12 * a23 - a22 * a13);
    let x = mx,
      y = my,
      z = mz,
      best = Infinity;
    const el = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2);
    if (Math.abs(det) > 1e-9) {
      const b1 = -q[3], b2 = -q[6], b3 = -q[8];
      const ox = (b1 * (a22 * a33 - a23 * a23) - a12 * (b2 * a33 - a23 * b3) + a13 * (b2 * a23 - a22 * b3)) / det;
      const oy = (a11 * (b2 * a33 - a23 * b3) - b1 * (a12 * a33 - a23 * a13) + a13 * (a12 * b3 - b2 * a13)) / det;
      const oz = (a11 * (a22 * b3 - b2 * a23) - a12 * (a12 * b3 - b2 * a13) + b1 * (a12 * a23 - a22 * a13)) / det;
      if ((ox - mx) ** 2 + (oy - my) ** 2 + (oz - mz) ** 2 < el * el) {
        x = ox;
        y = oy;
        z = oz;
        best = err(x, y, z);
      }
    }
    for (const [px, py, pz] of [
      [ax, ay, az],
      [bx, by, bz],
      [mx, my, mz],
    ]) {
      const e = err(px, py, pz);
      if (e < best) {
        best = e;
        x = px;
        y = py;
        z = pz;
      }
    }
    heap.push({ cost: Math.max(best, 0) + el * 1e-6, a, b, sa: stamp[a], sb: stamp[b], x, y, z });
  };

  const seen = new Set<number>();
  for (let f = 0; f < nF; f++)
    for (let c = 0; c < 3; c++) {
      const a = F[f * 3 + c],
        b = F[f * 3 + ((c + 1) % 3)];
      const key = a < b ? a * nV + b : b * nV + a;
      if (seen.has(key)) continue;
      seen.add(key);
      push(Math.min(a, b), Math.max(a, b));
    }

  const neighbours = (v: number, out: Set<number>) => {
    out.clear();
    for (const f of vf[v]) {
      if (!alive[f]) continue;
      for (let c = 0; c < 3; c++) {
        const w = F[f * 3 + c];
        if (w !== v) out.add(w);
      }
    }
    return out;
  };
  const na = new Set<number>(),
    nb = new Set<number>();
  const faceNormalOk = (f: number, moved: number, other: number, x: number, y: number, z: number) => {
    // reject a collapse that flips or crushes a surviving face
    const ids = [F[f * 3], F[f * 3 + 1], F[f * 3 + 2]];
    if (ids.includes(other)) return true;
    const p = ids.map((id) => [V[id * 3], V[id * 3 + 1], V[id * 3 + 2]]);
    const n0 = cross(p[0], p[1], p[2]);
    const i = ids.indexOf(moved);
    p[i] = [x, y, z];
    const n1 = cross(p[0], p[1], p[2]);
    const l0 = Math.hypot(n0[0], n0[1], n0[2]),
      l1 = Math.hypot(n1[0], n1[1], n1[2]);
    if (l1 < 1e-10) return false;
    return (n0[0] * n1[0] + n0[1] * n1[1] + n0[2] * n1[2]) / (l0 * l1) > 0.25;
  };

  let faces = nF;
  for (let i = 0; i < nF; i++) if (!alive[i]) faces--;
  while (faces > targetTris && heap.size) {
    const e = heap.pop()!;
    const { a, b } = e;
    if (stamp[a] !== e.sa || stamp[b] !== e.sb || stamp[a] < 0 || stamp[b] < 0) continue;
    neighbours(a, na);
    if (!na.has(b)) continue;
    neighbours(b, nb);
    let shared = 0;
    for (const w of na) if (nb.has(w)) shared++;
    if (shared !== 2) continue;
    let ok = true;
    for (const f of vf[a]) if (alive[f] && !faceNormalOk(f, a, b, e.x, e.y, e.z)) ok = false;
    if (ok) for (const f of vf[b]) if (alive[f] && !faceNormalOk(f, b, a, e.x, e.y, e.z)) ok = false;
    if (!ok) continue;

    V[a * 3] = e.x;
    V[a * 3 + 1] = e.y;
    V[a * 3 + 2] = e.z;
    for (let i = 0; i < 10; i++) Q[a * 10 + i] += Q[b * 10 + i];
    for (const f of vf[b]) {
      if (!alive[f]) continue;
      let hasA = false;
      for (let c = 0; c < 3; c++) if (F[f * 3 + c] === a) hasA = true;
      if (hasA) {
        alive[f] = 0;
        faces--;
      } else {
        for (let c = 0; c < 3; c++) if (F[f * 3 + c] === b) F[f * 3 + c] = a;
        vf[a].push(f);
      }
    }
    vf[a] = vf[a].filter((f) => alive[f]);
    stamp[b] = -1;
    stamp[a]++;
    for (const w of neighbours(a, na)) push(Math.min(a, w), Math.max(a, w));
  }

  const remap = new Int32Array(nV).fill(-1);
  const pos: number[] = [];
  const idx: number[] = [];
  for (let f = 0; f < nF; f++) {
    if (!alive[f]) continue;
    for (let c = 0; c < 3; c++) {
      const v = F[f * 3 + c];
      if (remap[v] < 0) {
        remap[v] = pos.length / 3;
        pos.push(V[v * 3], V[v * 3 + 1], V[v * 3 + 2]);
      }
      idx.push(remap[v]);
    }
  }
  return { positions: new Float32Array(pos), index: new Uint32Array(idx) };
}

function cross(a: number[], b: number[], c: number[]): [number, number, number] {
  const ux = b[0] - a[0],
    uy = b[1] - a[1],
    uz = b[2] - a[2];
  const vx = c[0] - a[0],
    vy = c[1] - a[1],
    vz = c[2] - a[2];
  return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
}

/** Expand an indexed mesh to flat-shaded triangles with face normals. */
export function flatten(positions: Float32Array, index: Uint32Array): { positions: Float32Array; normals: Float32Array } {
  const n = index.length;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  for (let t = 0; t < n; t += 3) {
    const p: number[][] = [];
    for (let c = 0; c < 3; c++) {
      const v = index[t + c] * 3;
      p.push([positions[v], positions[v + 1], positions[v + 2]]);
      pos.set(p[c], (t + c) * 3);
    }
    const nn = cross(p[0], p[1], p[2]);
    const l = Math.hypot(nn[0], nn[1], nn[2]) || 1;
    for (let c = 0; c < 3; c++) nor.set([nn[0] / l, nn[1] / l, nn[2] / l], (t + c) * 3);
  }
  return { positions: pos, normals: nor };
}
