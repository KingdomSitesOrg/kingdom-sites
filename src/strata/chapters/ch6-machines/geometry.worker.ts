/// <reference lib="webworker" />
import type { GeometryRequest } from './geometry';
import { buildGeometry } from './geometryBuild';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<GeometryRequest>) => {
  try {
    const { result, transfer } = buildGeometry(e.data);
    ctx.postMessage({ ok: true, result }, transfer);
  } catch (err) {
    ctx.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
