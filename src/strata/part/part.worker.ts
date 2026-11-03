/// <reference lib="webworker" />
import { handleRequest, type JobResult, type WorkerRequest } from './generate';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  try {
    const t0 = performance.now();
    const { result, transfer } = handleRequest(req);
    if (req.type === 'job') {
      (result as JobResult).timings[`${req.kind}.worker`] = Math.round((performance.now() - t0) * 10) / 10;
    }
    ctx.postMessage({ id: req.id, ok: true, result, ms: performance.now() - t0 }, transfer);
  } catch (err) {
    ctx.postMessage({ id: req.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
