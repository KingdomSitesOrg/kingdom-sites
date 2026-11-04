import type { Quality } from './types';

export const TIERS: Quality[] = ['low', 'medium', 'high'];

/** Per-chapter budgets, measured with ?debug=1 or stats(). See ARCHITECTURE.md. */
export const BUDGETS: Record<Quality, { drawCalls: number; triangles: number; particles: number; textureMB: number }> = {
  high: { drawCalls: 150, triangles: 1_500_000, particles: 200_000, textureMB: 96 },
  medium: { drawCalls: 90, triangles: 600_000, particles: 60_000, textureMB: 48 },
  low: { drawCalls: 50, triangles: 200_000, particles: 15_000, textureMB: 24 },
};

const DPR_CAP: Record<Quality, number> = { high: 2, medium: 1.5, low: 1 };

export function dprCap(q: Quality, deviceDpr: number) {
  return Math.min(deviceDpr, DPR_CAP[q]);
}

export function dprFloor(q: Quality, deviceDpr: number) {
  return Math.max(0.75, Math.min(dprCap(q, deviceDpr), DPR_CAP[q] * 0.65));
}

export function tierRank(q: Quality) {
  return TIERS.indexOf(q);
}

export interface DeviceInfo {
  renderer: string;
  memory: number | undefined;
  cores: number;
  coarse: boolean;
  width: number;
}

/** Picks the starting tier. Phones start at low, tablets at medium, desktops by GPU. */
export function detectQuality(d: DeviceInfo): Quality {
  const r = d.renderer.toLowerCase();
  if (/swiftshader|llvmpipe|software|basic render/.test(r)) return 'low';
  if (d.coarse && d.width < 768) return 'low';
  if (d.coarse) return 'medium';
  if ((d.memory !== undefined && d.memory < 4) || d.cores < 4) return 'medium';
  if (/apple m\d|apple gpu|nvidia|geforce|rtx|radeon|amd|arc\b/.test(r)) return 'high';
  if (/intel/.test(r)) return 'medium';
  return 'medium';
}
