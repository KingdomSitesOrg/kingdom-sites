'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type DependencyList } from 'react';
import type { PointLight, Vector3 } from 'three';
import type { Quality } from '@/strata/story';

/** Per-frame state the chapter Scene hands to each cell, after the camera has been placed. */
export type CellFrame = {
  p: number;
  raw: number;
  /** Ambient seconds (wall clock, or raw x 8 under capture). Frozen for hidden cells. */
  amb: number;
  /** The shared story clock (prog.time), for looks that must match a neighbour at a handoff. */
  time: number;
  dt: number;
  capture: boolean;
  quality: Quality;
  camera: Vector3;
  /** Distance camera -> target, mm. */
  dist: number;
};

/** Two point lights shared by all cells (fixed light count, so no program ever recompiles). */
export type CellLights = { a: PointLight; b: PointLight };

export type CellUpdate = (f: CellFrame) => void;

export type CellRegistry = { add(index: number, fn: { current: CellUpdate }): () => void };

export const CellContext = createContext<CellRegistry | null>(null);

/** Registers a cell update. The chapter calls it only while the cell is rendered. */
export function useCellFrame(index: number, fn: CellUpdate) {
  const reg = useContext(CellContext);
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  useLayoutEffect(() => reg?.add(index, ref), [reg, index]);
}

/** useMemo + dispose on unmount or when the deps change. */
export function useOwned<T extends { dispose(): void }>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo -- the caller lists the factory's deps
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}
