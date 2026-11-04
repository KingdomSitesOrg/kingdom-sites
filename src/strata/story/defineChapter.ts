import { palette, type PaletteToken } from '@/strata/ui/tokens';
import type { ChapterDefinition } from './types';

/**
 * Validates a chapter definition and returns it with `background` resolved to a hex (a palette token such as
 * 'bg-0' is allowed). One per chapter folder, as the default export.
 */
export function defineChapter(def: ChapterDefinition): ChapterDefinition {
  const background = def.background.startsWith('#') ? def.background : palette[def.background as PaletteToken];
  if (process.env.NODE_ENV !== 'production') {
    if (!/^[a-z][a-z0-9-]*$/.test(def.id)) throw new Error(`Chapter id "${def.id}" must be kebab-case`);
    for (const k of ['desktop', 'mobile'] as const) {
      if (!(def.length[k] >= 1.5)) throw new Error(`Chapter "${def.id}": length.${k} must be >= 1.5`);
    }
    if (def.stills.some((s) => s < 0 || s > 1)) throw new Error(`Chapter "${def.id}": stills must be within 0..1`);
    if (!background) throw new Error(`Chapter "${def.id}": background "${def.background}" is not a palette token or hex`);
  }
  return background === def.background ? def : { ...def, background: background ?? def.background };
}
