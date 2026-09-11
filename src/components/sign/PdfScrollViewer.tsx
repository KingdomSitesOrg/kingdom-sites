'use client'

import { useEffect, useRef, useState, type ReactNode, type MouseEvent, type PointerEvent } from 'react'

type Props = {
  url: string
  pageCount: number
  focusPage?: number
  className?: string
  renderPageOverlay?: (page: number) => ReactNode
  onPageClick?: (page: number, e: MouseEvent<HTMLDivElement>) => void
  placeMode?: boolean
  onFocusPageChange?: (page: number) => void
}

export default function PdfScrollViewer({
  url,
  pageCount,
  focusPage,
  className,
  renderPageOverlay,
  onPageClick,
  placeMode,
  onFocusPageChange,
}: Props) {
  const [pages, setPages] = useState(pageCount)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const docRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const lastFocusScrollRef = useRef<number | null>(null)
  const tapRef = useRef<{ page: number; x: number; y: number; moved: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false
    const resetTimer = window.setTimeout(() => {
      if (cancelled) return
      setReady(false)
      setLoading(true)
      setError('')
    }, 0)

    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Could not load PDF (${res.status}). Try refreshing / signing in again.`)
        }
        const data = new Uint8Array(await res.arrayBuffer())
        if (data.byteLength < 5 || String.fromCharCode(...data.slice(0, 4)) !== '%PDF') {
          throw new Error('Response was not a PDF. Check that you are signed in.')
        }

        const pdf = await pdfjs.getDocument({ data }).promise
        if (cancelled) {
          pdf.destroy()
          return
        }
        docRef.current = pdf
        const total = pdf.numPages
        setPages(total)

        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        )
        if (cancelled) return

        // Prefer the scroll container width so off-screen pages still render at full size on mobile.
        const containerWidth =
          pageRefs.current[0]?.parentElement?.clientWidth ||
          pageRefs.current[0]?.clientWidth ||
          720

        for (let i = 1; i <= total; i++) {
          const page = await pdf.getPage(i)
          if (cancelled) return
          let canvas = canvasRefs.current[i - 1]
          for (let attempt = 0; attempt < 10 && !canvas; attempt++) {
            await new Promise((r) => setTimeout(r, 16))
            canvas = canvasRefs.current[i - 1]
          }
          if (!canvas) continue

          const base = page.getViewport({ scale: 1 })
          const parentWidth = canvas.parentElement?.clientWidth || containerWidth || 720
          const targetWidth = Math.max(280, Math.min(720, parentWidth || containerWidth))
          const scale = targetWidth / base.width
          const viewport = page.getViewport({ scale })
          const ratio = window.devicePixelRatio || 1
          canvas.width = Math.floor(viewport.width * ratio)
          canvas.height = Math.floor(viewport.height * ratio)
          canvas.style.width = `${viewport.width}px`
          canvas.style.height = `${viewport.height}px`
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
          await page.render({ canvasContext: ctx, viewport }).promise
        }
        if (!cancelled) {
          setReady(true)
          setLoading(false)
        }
      } catch (err) {
        console.error('[PdfScrollViewer]', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not render PDF.')
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
      window.clearTimeout(resetTimer)
      try {
        docRef.current?.destroy()
      } catch {
        /* ignore */
      }
      docRef.current = null
    }
  }, [url])

  // Only scroll when focusPage actually changes — not every time `ready` flips,
  // which was yanking mobile users back to page 1 while they tried to reach page 2+.
  useEffect(() => {
    if (!focusPage || !ready) return
    if (lastFocusScrollRef.current === focusPage) return
    lastFocusScrollRef.current = focusPage
    const el = pageRefs.current[focusPage - 1]
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focusPage, ready])

  const pageList = Array.from({ length: pages }, (_, i) => i + 1)

  function onOverlayPointerDown(page: number, e: PointerEvent<HTMLDivElement>) {
    if (!placeMode || !onPageClick) return
    if ((e.target as HTMLElement).closest('[data-field-id]')) return
    tapRef.current = { page, x: e.clientX, y: e.clientY, moved: false }
  }

  function onOverlayPointerMove(e: PointerEvent<HTMLDivElement>) {
    const tap = tapRef.current
    if (!tap) return
    if (Math.abs(e.clientX - tap.x) > 10 || Math.abs(e.clientY - tap.y) > 10) {
      tap.moved = true
    }
  }

  function onOverlayPointerUp(page: number, e: PointerEvent<HTMLDivElement>) {
    const tap = tapRef.current
    tapRef.current = null
    if (!placeMode || !onPageClick) return
    if (!tap || tap.page !== page || tap.moved) return
    if ((e.target as HTMLElement).closest('[data-field-id]')) return
    // Synthesize a mouse-like event shape for existing onPlace handler.
    onPageClick(page, e as unknown as MouseEvent<HTMLDivElement>)
  }

  return (
    <div className={className}>
      {error ? <p className="p-4 text-sm text-warm">{error}</p> : null}
      {loading ? <p className="p-4 text-sm text-muted">Loading document…</p> : null}
      {pages > 1 ? (
        <div className="mb-3 flex flex-wrap gap-2 px-1">
          {pageList.map((page) => (
            <button
              key={`jump-${page}`}
              type="button"
              className={`btn-ghost-sm ${focusPage === page ? 'is-active' : ''}`}
              onClick={() => {
                lastFocusScrollRef.current = null
                onFocusPageChange?.(page)
                const el = pageRefs.current[page - 1]
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                lastFocusScrollRef.current = page
              }}
            >
              Page {page}
            </button>
          ))}
        </div>
      ) : null}
      <div
        className={`mx-auto flex max-w-3xl flex-col gap-4 ${loading && !ready ? 'min-h-[40vh]' : ''}`}
      >
        {pageList.map((page) => (
          <div
            key={`${url}-p${page}`}
            ref={(el) => {
              pageRefs.current[page - 1] = el
            }}
            data-page={page}
            className="relative mx-auto w-full overflow-hidden rounded-md border border-line bg-white shadow-sm"
          >
            <canvas
              ref={(el) => {
                canvasRefs.current[page - 1] = el
              }}
              className="block h-auto w-full"
            />
            <div
              className={`absolute inset-0 ${placeMode ? 'cursor-crosshair' : ''}`}
              style={{ touchAction: placeMode ? 'pan-y' : 'auto' }}
              onPointerDown={(e) => onOverlayPointerDown(page, e)}
              onPointerMove={onOverlayPointerMove}
              onPointerUp={(e) => onOverlayPointerUp(page, e)}
              onPointerCancel={() => {
                tapRef.current = null
              }}
              // Keep click for desktop mice that do not go through the pointer-up path cleanly.
              onClick={(e) => {
                if (placeMode) return // handled by pointer up (avoids double-place)
                if ((e.target as HTMLElement).closest('[data-field-id]')) return
                onPageClick?.(page, e)
              }}
              role="presentation"
            >
              {renderPageOverlay?.(page)}
            </div>
            <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">
              Page {page}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
