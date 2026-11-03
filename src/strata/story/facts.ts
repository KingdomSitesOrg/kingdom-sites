/**
 * Every number the page shows (STORYBOARD 2.1). Import it; never restate a value by hand.
 * Pure data with no imports, so DOM code, Scenes and `node --test` can all load it.
 */

export const facts = {
  part: {
    envelopeMM: { x: 88.0, y: 42.0, z: 40.0 },
    heightMM: 42.0,
    massG: { solid: 412, optimized: 96 },
    material: 'Ti-6Al-4V',
    densityGcm3: 4.43,
    optimizedVolumeCm3: 21.7,
    massByMaterialG: { titanium: 96, carbonNylon: 25, clearResin: 26 },
    densityByMaterialGcm3: { titanium: 4.43, carbonNylon: 1.15, clearResin: 1.18 },
    massSavedPct: 77,
  },
  load: {
    forceN: 120,
    at: 'collar',
    landingG: 3,
    sigmaMaxMPa: 352,
    yieldMPa: 880,
    safetyFactor: 2.5,
  },
  infill: { pattern: 'gyroid', pct: 18, cellMM: 4.0 },
  layer: {
    heightMM: 0.05,
    count: 840,
    /** Printed layer-1 path, measured by the part module (`LAYER1_PATH_MM` in '@/strata/part'). */
    layer1PathMM: 713.5,
  },
  fdmProof: {
    material: 'PA12-CF',
    nozzleMM: 0.25,
    nozzle: 'hardened steel',
    nozzleC: 270,
    bedC: 85,
    speedMMs: 120,
    beadMM: 0.27,
    printTimeS: 10080,
    printTimeLabel: '2 h 48 min',
  },
  sla: { wavelengthNM: 405, exposureS: 2.4, layerMM: 0.05 },
  sls: { material: 'PA12', laserW: 60, laser: 'CO₂', bedC: 172, recoatMM: 0.1, nestedParts: 12 },
  lpbf: {
    material: 'Ti-6Al-4V',
    laserW: 400,
    meltPoolC: 1940,
    oxygenPctMax: 0.1,
    partCoolC: { from: 940, to: 32 },
    cmmToleranceMM: 0.02,
  },
  fleet: {
    printers: 1296,
    grid: { cols: 36, rows: 36 },
    active: 1248,
    byProcess: { fdm: 648, sla: 288, sls: 216, lpbf: 144 },
  },
  plants: ['Rotterdam', 'Austin', 'Osaka'],
  partsTodayBase: 18240,
  turnaroundDays: 2.6,
  partsShipped: { count: 2_400_000, label: '2.4M', since: 2023 },
  materialsCount: 42,
  avgMassSavedPct: 61,
  maxMassSavedPct: 80,
  processOf: {
    titanium: 'Metal LPBF',
    carbonNylon: 'FDM',
    clearResin: 'Resin SLA',
    whiteNylon: 'SLS',
  },
  /** The "today" used for ship dates under ?capture=1 (a Monday). */
  captureToday: '2026-11-02',
} as const;

export type Facts = typeof facts;
