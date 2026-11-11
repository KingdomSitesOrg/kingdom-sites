'use client'

import { useState, type CSSProperties } from 'react'
import { play } from '../_lib/sound'

/* One big tile that turns over when pressed: a project's name on the front,
   its line from the portfolio on the back. */
export default function FlipTile({
  index,
  title,
  body,
  ground,
  ink,
  pattern,
}: {
  index: string
  title: string
  body: string
  /** The back's colour, and the colour of the words on it. */
  ground: string
  ink: string
  /** A five by five patch of tiles for the front, rows of X (laid) and . (bare). */
  pattern: string[]
}) {
  const [turned, setTurned] = useState(false)
  return (
    <button
      type="button"
      className="mu-flip"
      style={{ '--bk': ground, '--fg': ink } as CSSProperties}
      aria-pressed={turned}
      onClick={() => {
        setTurned((v) => !v)
        play('flip')
      }}
    >
      <span className="mu-flip-in">
        <span className="mu-flip-face mu-flip-front">
          <span className="mu-flip-index">
            {index}
            <span className="mu-flip-hint" aria-hidden="true">
              Turn it over
            </span>
          </span>
          <span className="mu-flip-art" aria-hidden="true">
            {pattern
              .join('')
              .split('')
              .map((bit, i) => (
                <i key={i} className={bit === 'X' ? 'is-laid' : undefined} />
              ))}
          </span>
          <span className="mu-flip-title">{title}</span>
        </span>
        <span className="mu-flip-face mu-flip-back">
          <span className="mu-flip-index">{index}</span>
          <span className="mu-flip-body">{body}</span>
        </span>
      </span>
    </button>
  )
}
