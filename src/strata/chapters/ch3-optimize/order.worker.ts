// Builds Ch3's triangle orders off the main thread (see orderCore.ts).
import { computeOrders, type OrderRequest } from './orderCore';

self.onmessage = (e: MessageEvent<OrderRequest>) => {
  const r = computeOrders(e.data);
  (self as unknown as Worker).postMessage(r, [
    r.opt.index.buffer,
    r.opt.minZ.buffer,
    r.infill.index.buffer,
    r.infill.minZ.buffer,
    r.skin.index.buffer,
  ]);
};
