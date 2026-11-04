'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { PartQuality } from './constants';
import { getPart, latestPart, preloadPart, subscribePart, type PartData } from './part';

/**
 * The shared bracket, without suspending: null until the first tier is generated. When the requested tier is
 * not built yet it returns the most recently built one, so the object never vanishes while a tier changes.
 * Chapters prefer `use(preloadPart(usePartQuality()))`, which suspends the Scene until the part exists.
 * Geometries are shared: render them with dispose={null}.
 */
export function usePart(quality: PartQuality = 'high'): PartData | null {
  const part = useSyncExternalStore(
    subscribePart,
    () => getPart(quality) ?? latestPart(),
    () => null,
  );
  useEffect(() => {
    void preloadPart(quality);
  }, [quality]);
  return part;
}
