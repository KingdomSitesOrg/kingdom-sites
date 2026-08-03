import type { ReactNode } from 'react'
import { Children } from 'react'
import { evenGridClass, idealColumnCount } from '@/lib/squareup'

type Props = {
  children: ReactNode
  /** Hard cap on columns (default 3). */
  maxCols?: number
  /** Force a column count when you already know it divides evenly. */
  cols?: number
  className?: string
  /** Optional label for the squareup auditor / debugging. */
  surface?: string
}

/**
 * Card grid that always fills complete rows.
 * Column count is chosen so itemCount % cols === 0 (within maxCols).
 */
export default function EvenGrid({ children, maxCols = 3, cols, className = '', surface }: Props) {
  const items = Children.toArray(children).filter(Boolean)
  const count = items.length
  const resolved = cols ?? idealColumnCount(count, maxCols)
  const gridClass = evenGridClass(resolved)

  return (
    <div
      className={`${gridClass} ${className}`.trim()}
      data-squareup="even-grid"
      data-squareup-surface={surface}
      data-squareup-count={count}
      data-squareup-cols={resolved}
    >
      {items}
    </div>
  )
}
