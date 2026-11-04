// Triangle orders for Ch3 (pure; shared by the worker and the main-thread fallback in order.ts):
//  - z: triangles by ascending min-z, so the section cut draws a prefix (optimized) or a slab (infill).
//  - skin: optimized triangles that do not lie under the solid's skin first, so the erosion phase draws only
//    those (the rest are hidden behind the solid until it is gone).
import { sdSolid } from '@/strata/part/sdf';

/** Optimized vertices this close to the solid surface sit under its skin. */
export const UNDER_SKIN = 0.12;

export type ZOrder = { index: Uint32Array; minZ: Float32Array };
export type SkinOrder = { index: Uint32Array; visible: number };
export type OrderRequest = { optPos: Float32Array; optIndex: Uint32Array; infillPos: Float32Array; infillIndex: Uint32Array };
export type OrderResult = { opt: ZOrder; infill: ZOrder; skin: SkinOrder };

export function zOrder(pos: Float32Array, index: Uint32Array): ZOrder {
  const n = index.length / 3;
  const key = new Float32Array(n);
  for (let t = 0; t < n; t++) {
    key[t] = Math.min(pos[index[t * 3] * 3 + 2], pos[index[t * 3 + 1] * 3 + 2], pos[index[t * 3 + 2] * 3 + 2]);
  }
  const order = new Uint32Array(n);
  for (let t = 0; t < n; t++) order[t] = t;
  order.sort((x, y) => key[x] - key[y]);
  const out = new Uint32Array(n * 3);
  const minZ = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = order[i];
    out[i * 3] = index[t * 3];
    out[i * 3 + 1] = index[t * 3 + 1];
    out[i * 3 + 2] = index[t * 3 + 2];
    minZ[i] = key[t];
  }
  return { index: out, minZ };
}

export function skinOrder(pos: Float32Array, index: Uint32Array): SkinOrder {
  const vc = pos.length / 3;
  const under = new Uint8Array(vc);
  const p = { x: 0, y: 0, z: 0 };
  for (let v = 0; v < vc; v++) {
    p.x = pos[v * 3];
    p.y = pos[v * 3 + 1];
    p.z = pos[v * 3 + 2];
    under[v] = Math.abs(sdSolid(p)) < UNDER_SKIN ? 1 : 0;
  }
  const n = index.length / 3;
  const out = new Uint32Array(n * 3);
  let head = 0;
  let tail = n - 1;
  for (let t = 0; t < n; t++) {
    const a = index[t * 3];
    const b = index[t * 3 + 1];
    const c = index[t * 3 + 2];
    const slot = under[a] && under[b] && under[c] ? tail-- : head++;
    out[slot * 3] = a;
    out[slot * 3 + 1] = b;
    out[slot * 3 + 2] = c;
  }
  return { index: out, visible: head };
}

export function computeOrders(req: OrderRequest): OrderResult {
  return {
    opt: zOrder(req.optPos, req.optIndex),
    infill: zOrder(req.infillPos, req.infillIndex),
    skin: skinOrder(req.optPos, req.optIndex),
  };
}
