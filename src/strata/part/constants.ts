export type PartQuality = 'high' | 'medium' | 'low';
export type PartKind = 'solid' | 'solidLow' | 'optimized' | 'infill';

/** Overall size in millimetres (x, y, z). */
export const PART_SIZE = { x: 88, y: 42, z: 40 } as const;

/** Axis-aligned bounds in millimetres: base on y = 0, centred in x and z. */
export const PART_BOUNDS = {
  min: [-44, 0, -20] as const,
  max: [44, 42, 20] as const,
};

/** Centre of the bounds (mm); handy as an orbit target. */
export const PART_CENTER = [0, 21, 0] as const;

/** Recommended world scale: 1 world unit = 10 mm, so the part is 8.8 x 4.2 x 4.0 units. */
export const PART_SCALE = 0.1;

/** Ti-6Al-4V, g/cm^3. */
export const TI64_DENSITY = 4.43;

/** Gyroid infill: cell size, sheet wall and outer skin (mm). */
export const INFILL = { cell: 6, wall: 1.2, shell: 1.2 } as const;

/** Toolpath settings used by the slicer (mm): the FDM proof's 0.27 mm bead, 3 perimeters, 4 mm gyroid cell. */
export const TOOLPATH = { lineWidth: 0.27, perimeters: 3, infillCell: 4 } as const;

/** Layer height (mm) and the mid-height of layer 1, where its toolpath is sliced. */
export const LAYER = { height: 0.05, first: 0.025 } as const;

/**
 * Measured printed length (mm, classes 0-2: perimeters and infill, no travel) of the high-tier layer-1 toolpath,
 * `part.toolpaths([LAYER.first])`. Source for facts.layer.layer1PathMM; re-measure whenever the geometry changes.
 */
export const LAYER1_PATH_MM = 713.5;

/** Grid spacing (mm) per mesh and quality tier. */
export const MESH_RES: Record<PartQuality, { solid: number; optimized: number; infill: number; slice: number }> = {
  high: { solid: 1.0, optimized: 0.52, infill: 0.45, slice: 0.25 },
  medium: { solid: 1.3, optimized: 0.66, infill: 0.52, slice: 0.32 },
  low: { solid: 1.7, optimized: 0.86, infill: 0.68, slice: 0.42 },
};

/** `sliceStack` outlines per tier: slicing grid and simplification tolerance (mm). */
export const STACK: Record<PartQuality, { cell: number; tol: number }> = {
  high: { cell: 0.35, tol: 0.04 },
  medium: { cell: 0.42, tol: 0.06 },
  low: { cell: 0.5, tol: 0.09 },
};

/** Faceted low-poly target triangle count. */
export const SOLID_LOW_TRIS = 820;

/** Meshing bounds with a margin so every surface closes inside the grid. */
export const MESH_MIN: [number, number, number] = [-46, -1.5, -22];
export const MESH_MAX: [number, number, number] = [46, 44, 22];
