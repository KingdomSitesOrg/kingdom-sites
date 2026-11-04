'use client';

import { LPBF_LAYER_Y, SLA_LAYER_Y } from './timeline';

export type Loops = { outer: Float32Array[]; holes: Float32Array[] };

export type GeometryRequest = { slaHeights: number[]; lpbfHeight: number; nestedRes: number };

export type GeometryResult = {
  /** One section per SLA flash. */
  sla: Loops[];
  sls: {
    /** Ribbon vertices (x, z) on the bed, laser-time per vertex, triangle index. */
    position: Float32Array;
    time: Float32Array;
    index: Uint32Array;
    /** Laser head path: (x, z, T, on) per point. */
    head: Float32Array;
    total: number;
  };
  lpbf: {
    /** Per hatch line: vmin, vmax, Tstart, direction. */
    table: Float32Array;
    /** Lasing intervals (v0, v1) for all lines, indexed by segStart. */
    segs: Float32Array;
    segStart: Uint32Array;
    count: number;
    u0: number;
    spacing: number;
    angle: number;
    total: number;
    /** [loopCount, n0, x, z, ..., n1, ...] */
    loops: Float32Array;
  };
  nested: { positions: Float32Array; normals: Float32Array; index: Uint32Array };
};

const cache = new Map<number, Promise<GeometryResult>>();

function onMainThread(req: GeometryRequest): Promise<GeometryResult> {
  return import('./geometryBuild').then((m) => m.buildGeometry(req).result);
}

/** Built once per detail level in a worker (main-thread fallback); never rejects. */
export function requestGeometry(nestedRes: number): Promise<GeometryResult> {
  let p = cache.get(nestedRes);
  if (!p) {
    const req: GeometryRequest = { slaHeights: [...SLA_LAYER_Y], lpbfHeight: LPBF_LAYER_Y, nestedRes };
    p = new Promise<GeometryResult>((resolve) => {
      let worker: Worker;
      try {
        worker = new Worker(new URL('./geometry.worker.ts', import.meta.url), { type: 'module' });
      } catch {
        resolve(onMainThread(req));
        return;
      }
      worker.onmessage = (e: MessageEvent<{ ok: boolean; result?: GeometryResult }>) => {
        worker.terminate();
        resolve(e.data.ok && e.data.result ? e.data.result : onMainThread(req));
      };
      worker.onerror = (e) => {
        e.preventDefault();
        worker.terminate();
        resolve(onMainThread(req));
      };
      worker.postMessage(req);
    });
    cache.set(nestedRes, p);
  }
  return p;
}

