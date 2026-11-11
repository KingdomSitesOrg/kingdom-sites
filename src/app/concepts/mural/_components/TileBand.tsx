'use client'

import { useEffect, useRef } from 'react'
import { BLUE, GROUT, G_SKY, G_WALL, ORANGE, PAGE, RIM_IN, RIM_NEAR, clamp, hash, noise, pick, skyTone, smooth, tileSize, wallTone } from '../_lib/tiles'

/* The join between the light wall and the dark closing section: the page's
   plain tone gathers into tiles, the tiles thin out, and the night sky takes
   over. Drawn once (and again if the window changes width); nothing moves. */
export default function TileBand({ rows = 22 }: { rows?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d', { alpha: false })
    if (!canvas || !ctx) return
    let drawnFor = 0

    const draw = () => {
      const W = Math.round(canvas.parentElement?.clientWidth ?? 0)
      if (!W || W === drawnFor) return
      drawnFor = W
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const T = Math.round(tileSize(W) * dpr)
      const rest = T - 2 * Math.max(1, Math.round(dpr / 2))
      const off = (T - rest) / 2
      const cols = Math.ceil((W * dpr) / T)
      canvas.width = Math.round(W * dpr)
      canvas.height = rows * T
      canvas.style.height = `${canvas.height / dpr}px`
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * T
          const y = r * T
          // The line between wall and sky wanders a little from column to column.
          const p = clamp((r + 0.5) / rows + (noise(c / 7, 0, 31) - 0.5) * 0.22)
          const h = hash(c, r, 33)
          if (h < smooth(0.3, 0.72, p)) {
            ctx.fillStyle = GROUT[G_SKY]
            ctx.fillRect(x, y, T, T)
            const edge = p < 0.6 && hash(c, r, 34) < 0.3
            ctx.fillStyle = edge ? pick(RIM_NEAR, hash(c, r, 35)) : skyTone(c, r + 400)
            ctx.fillRect(x + off, y + off, rest, rest)
            continue
          }
          if (h > smooth(0.02, 0.3, p) * 1.2) {
            ctx.fillStyle = PAGE
            ctx.fillRect(x, y, T, T)
            continue
          }
          ctx.fillStyle = GROUT[G_WALL]
          ctx.fillRect(x, y, T, T)
          const stray = hash(c, r, 36)
          const b = 0.86 - smooth(0.25, 0.75, p) * 0.36 + (noise(c / 5, r / 5, 37) - 0.5) * 0.2
          ctx.fillStyle = stray < 0.012 ? ORANGE : stray < 0.03 ? BLUE : p > 0.45 && stray < 0.2 ? pick(RIM_IN, stray * 5) : wallTone(b)
          ctx.fillRect(x + off, y + off, rest, rest)
        }
      }
    }

    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [rows])

  return (
    <div className="mu-band" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  )
}
