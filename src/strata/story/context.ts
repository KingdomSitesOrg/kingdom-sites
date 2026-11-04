'use client';

import { createContext, type RefObject } from 'react';
import type { ChapterDefinition, ChapterFx, ChapterProgress, SlotState } from './types';

export interface ChapterContextValue {
  index: number;
  id: string;
  def: ChapterDefinition;
  progress: { readonly current: ChapterProgress };
  fx: ChapterFx;
  /** The sticky container (DOM side). */
  root: RefObject<HTMLDivElement | null>;
  /** Present inside the chapter Scene only. */
  slot: SlotState | null;
}

export const ChapterContext = createContext<ChapterContextValue | null>(null);
