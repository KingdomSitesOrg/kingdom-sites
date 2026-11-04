// The toolpaths Ch5 prints from: layers 1-4 exactly plus 32 / 16 / 8 representative layers, requested from the part
// worker in one batch (STORYBOARD Ch5). Cached per part so the Scene can suspend on it: the chapter only counts as
// ready (and captures only fire) once the nozzle has a path.
import { LAYER, type PartData, type Toolpath } from '@/strata/part';
import { NozzleMotion } from './motion';
import { plot } from './signals';
import { supportContacts } from './supports';

let contacts: { x: number; y: number; z: number }[] | null = null;

/** Support contact points under the overhangs, found once (geometry only) while the toolpaths load. */
export function getSupportContacts() {
  return (contacts ??= supportContacts());
}

const cache = new WeakMap<PartData, Map<number, Promise<NozzleMotion>>>();

function representativeLayers(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const L = Math.round(((i + 0.5) / n) * 840);
    if (L > 4 && !out.includes(L)) out.push(L);
  }
  return out;
}

/** The layer's path for the HUD plot, in a 92 x 44 viewBox (mm, origin at the part's -x, -z corner). */
function svgPath(tp: Toolpath): string {
  const parts: string[] = [];
  let lx = Infinity,
    lz = Infinity;
  const n = tp.xz.length / 2;
  for (let i = 0; i < n; i++) {
    const x = tp.xz[i * 2],
      z = tp.xz[i * 2 + 1];
    const travel = tp.cls[i] === 3 || i === 0;
    if (!travel && (x - lx) ** 2 + (z - lz) ** 2 < 0.36 && i < n - 1) continue;
    parts.push(`${travel ? 'M' : 'L'}${(x + 46).toFixed(1)} ${(z + 22).toFixed(1)}`);
    lx = x;
    lz = z;
  }
  return parts.join('');
}

export function loadMotion(part: PartData, reps: number): Promise<NozzleMotion> {
  let byCount = cache.get(part);
  if (!byCount) cache.set(part, (byCount = new Map()));
  let p = byCount.get(reps);
  if (!p) {
    const layers = representativeLayers(reps);
    const ys = [1, 2, 3, 4, ...layers].map((n) => LAYER.first + (n - 1) * LAYER.height);
    p = part.toolpaths(ys).then((tps) => {
      const m = new NozzleMotion(
        tps.slice(0, 4),
        layers.map((layer, i) => ({ layer, tp: tps[4 + i] })),
      );
      plot.paths = m.repPaths.map(svgPath);
      plot.version++;
      getSupportContacts();
      return m;
    });
    byCount.set(reps, p);
  }
  return p;
}
