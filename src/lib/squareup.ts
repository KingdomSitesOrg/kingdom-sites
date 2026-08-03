/**
 * Layout helpers for even card grids (complete rows only).
 * Agent workflow: Grok/Claude skill `squareup` (~/.grok/skills/squareup).
 */

/** Largest column count ≤ maxCols that divides itemCount evenly. */
export function idealColumnCount(itemCount: number, maxCols = 4): number {
  if (itemCount <= 1) return 1
  const cap = Math.min(maxCols, itemCount)
  for (let c = cap; c >= 2; c--) {
    if (itemCount % c === 0) return c
  }
  return 1
}

export function fillsEvenRows(itemCount: number, cols: number): boolean {
  if (cols < 2) return true
  return itemCount > 0 && itemCount % cols === 0
}

/** Tailwind classes for a full-row grid at this column count. */
export function evenGridClass(cols: number): string {
  switch (cols) {
    case 1:
      return 'grid grid-cols-1 gap-4 sm:gap-5'
    case 2:
      return 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5'
    case 3:
      return 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3'
    case 4:
      return 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4'
    default:
      return 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5'
  }
}
