import { facts } from './facts';

/**
 * Designed static plates: what a visitor without WebGL (or with reduced motion) sees for a chapter until its
 * captured stills exist. One image per stage in `public/plates/<id>-<n>.webp` (1600 x 1000, subject in the right
 * 60 % so the copy column stays clear), rendered offline from the part's own distance fields. Stage n holds at
 * the chapter's still n and crossfades like a captured still. Labels are decorative (the copy carries the story).
 */
export interface Plate {
  stages: readonly string[];
}

const layers = (h: number) =>
  `Layer ${String(Math.round((h / facts.part.heightMM) * facts.layer.count)).padStart(4, '0')} / ${String(facts.layer.count).padStart(4, '0')}`;

export const PLATES: Record<string, Plate> = {
  ignition: { stages: ['Nozzle at temperature'] },
  idea: { stages: ['Prompt parsed', 'Constraints swarm', 'Point cloud'] },
  model: { stages: ['Point cloud', 'Wireframe', 'Low-poly', 'Subdivision', `Material · ${facts.part.material}`] },
  optimize: {
    stages: [
      `Design space · ${facts.part.massG.solid} g`,
      'Removing what carries no load',
      `Stress · σ max ${facts.load.sigmaMaxMPa} MPa`,
      `Gyroid infill · ${facts.part.massG.optimized} g`,
    ],
  },
  slice: { stages: [`${facts.layer.count} layers · ${facts.layer.heightMM} mm`, 'Slices fanned', 'Layer toolpath'] },
  print: { stages: [layers(6), layers(18), layers(31), 'Print complete'] },
  machines: { stages: ['Resin SLA · UV flash', 'Nylon SLS · laser on powder', `${facts.sls.nestedParts} nested parts`, 'Metal LPBF · melt pool', 'Cooled to flight grade'] },
  fleet: { stages: ['One cabinet', `${facts.fleet.printers.toLocaleString('en-US')} machines`, 'One window, one job'] },
  object: { stages: ['Turntable · 340°', 'Turntable · 035°', 'Turntable · 160°'] },
};

export const plateSrc = (id: string, n: number) => `/strata/plates/${id}-${n}.webp`;

/**
 * Opacity of layer `n` in a stack held at `stops` (progress points) at progress `p`: each layer holds, then the
 * next fades in over a `fade`-wide window centred between the two stops (smoothstep), opacity only.
 */
export function stillOpacity(stops: readonly number[], p: number, n: number, fade: number): number {
  const last = stops.length - 1;
  let j = 0;
  while (j < last && p >= stops[j + 1]) j++;
  const mid = j < last ? (stops[j] + stops[j + 1]) / 2 : 2;
  const f = Math.min(1, Math.max(0, (p - (mid - fade / 2)) / fade));
  const eased = f * f * (3 - 2 * f);
  return n < j ? 0 : n === j ? 1 : n === j + 1 ? eased : 0;
}
