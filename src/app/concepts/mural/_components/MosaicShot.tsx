'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

/* A picture that arrives the way the wall does: as a few big tiles, then
   smaller ones, then the picture itself, snapping a step at a time as it
   scrolls into view. Without scripts, or with motion turned down, it is just
   the picture. */

/* Tile widths for each step, in CSS pixels, biggest first. */
const STEPS = [44, 24, 13, 7]
const BEAT = 115

export default function MosaicShot({
  src,
  alt,
  w,
  h,
  sizes,
  delay = 0,
}: {
  src: string
  alt: string
  w: number
  h: number
  sizes: string
  /** Milliseconds to wait once in view, so a row of pictures resolves one after another. */
  delay?: number
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const box = boxRef.current
    const img = imgRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const small = document.createElement('canvas')
    const sctx = small.getContext('2d')
    if (!box || !img || !canvas || !ctx || !sctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // No tiles: show the picture as it is.
      box?.classList.add('is-done')
      return
    }
    let seen = false
    let ran = false
    const timers: number[] = []

    const loaded = () => img.complete && img.naturalWidth > 0

    const draw = (tile: number) => {
      const bw = box.clientWidth
      const bh = box.clientHeight
      if (!bw || !bh || !loaded()) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(bw * dpr)
      canvas.height = Math.round(bh * dpr)
      const across = Math.max(3, Math.round(bw / tile))
      const down = Math.max(3, Math.round((across * bh) / bw))
      small.width = across
      small.height = down
      // The same crop the picture itself gets (it fills its box from the top).
      const k = Math.max(bw / img.naturalWidth, bh / img.naturalHeight)
      const cw = bw / k
      const ch = bh / k
      sctx.drawImage(img, (img.naturalWidth - cw) / 2, 0, cw, ch, 0, 0, across, down)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(small, 0, 0, across, down, 0, 0, canvas.width, canvas.height)
      // Grout between the tiles.
      ctx.fillStyle = 'rgba(10, 12, 18, 0.2)'
      const line = Math.max(1, Math.round(dpr))
      for (let i = 1; i < across; i++) ctx.fillRect(Math.round((i * canvas.width) / across), 0, line, canvas.height)
      for (let j = 1; j < down; j++) ctx.fillRect(0, Math.round((j * canvas.height) / down), canvas.width, line)
    }

    const run = () => {
      if (ran || !seen || !loaded()) return
      ran = true
      STEPS.forEach((tile, i) => timers.push(window.setTimeout(() => draw(tile), delay + i * BEAT)))
      timers.push(window.setTimeout(() => setDone(true), delay + STEPS.length * BEAT))
    }

    const onLoad = () => {
      draw(STEPS[0])
      run()
    }
    if (loaded()) onLoad()
    else img.addEventListener('load', onLoad, { once: true })

    const watch = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        seen = true
        watch.disconnect()
        run()
      },
      { threshold: 0.3 },
    )
    watch.observe(box)

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      img.removeEventListener('load', onLoad)
      watch.disconnect()
    }
  }, [delay])

  return (
    <div ref={boxRef} className={`mu-shot${done ? ' is-done' : ''}`} style={{ aspectRatio: `${w} / ${h}` }}>
      <Image ref={imgRef} src={src} alt={alt} width={w} height={h} sizes={sizes} />
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  )
}
