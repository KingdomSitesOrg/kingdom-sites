// Builds Ch3's triangle orders once per part tier in a worker, with a main-thread fallback (see orderCore.ts).
import type { BufferGeometry } from 'three';
import { computeOrders, type OrderRequest, type OrderResult } from './orderCore';

export type { OrderResult } from './orderCore';

const cache = new WeakMap<BufferGeometry, Promise<OrderResult>>();

function copyIndex(g: BufferGeometry): Uint32Array {
  const idx = g.getIndex();
  if (idx) return Uint32Array.from(idx.array as ArrayLike<number>);
  const n = g.getAttribute('position').count;
  const out = new Uint32Array(n);
  for (let i = 0; i < n; i++) out[i] = i;
  return out;
}

/** Orders for this part's optimized and infill meshes, cached per geometry. */
export function buildOrders(optimized: BufferGeometry, infill: BufferGeometry): Promise<OrderResult> {
  const hit = cache.get(optimized);
  if (hit) return hit;
  const req: OrderRequest = {
    optPos: Float32Array.from(optimized.getAttribute('position').array as ArrayLike<number>),
    optIndex: copyIndex(optimized),
    infillPos: Float32Array.from(infill.getAttribute('position').array as ArrayLike<number>),
    infillIndex: copyIndex(infill),
  };
  const run = new Promise<OrderResult>((resolve) => {
    let worker: Worker | null = null;
    const fallback = () => {
      worker?.terminate();
      resolve(computeOrders(req));
    };
    try {
      worker = new Worker(new URL('./order.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      fallback();
      return;
    }
    worker.onmessage = (e: MessageEvent<OrderResult>) => {
      worker?.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      e.preventDefault();
      fallback();
    };
    worker.postMessage(req);
  });
  cache.set(optimized, run);
  return run;
}
