'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
  type PointerEvent,
} from 'react'

type Props = {
  url: string
  pageCount: number
  focusPage?: number
  className?: string
  renderPageOverlay?: (page: number) => ReactNode
  onPageClick?: (page: number, e: MouseEvent<HTMLDivElement>) => void
  placeMode?: boolean
  onFocusPageChange?: (page: number) => void
  /** Fired when pdf.js reports numPages (may exceed a stale envelope.pageCount). */
  onDocumentPages?: (pages: number) => void
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
  onDocumentPages,
}: Props) {
  const [pages, setPages] = useState(pageCount)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const docRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const lastFocusScrollRef = useRef<number | null>(null)
  const tapRef = useRef<{ page: number; x: number; y: number; moved: boolean } | null>(null)
  const onDocumentPagesRef = useRef(onDocumentPages)
  const maxPageWidth = expanded ? 1100 : 720

  useEffect(() => {
    onDocumentPagesRef.current = onDocumentPages
  }, [onDocumentPages])

  const closeExpanded = useCallback(() => setExpanded(false), [])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeExpanded()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [expanded, closeExpanded])

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
        onDocumentPagesRef.current?.(total)

        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        )
        if (cancelled) return

        const containerWidth =
          scrollContainerRef.current?.clientWidth ||
          pageRefs.current[0]?.parentElement?.clientWidth ||
          pageRefs.current[0]?.clientWidth ||
          maxPageWidth

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
          const parentWidth = canvas.parentElement?.clientWidth || containerWidth || maxPageWidth
          const targetWidth = Math.max(280, Math.min(maxPageWidth, parentWidth || containerWidth))
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
  }, [url, maxPageWidth])

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
    onPageClick(page, e as unknown as MouseEvent<HTMLDivElement>)
  }

  const chrome = (
    <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
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
      <button
        type="button"
        className="btn-ghost-sm ml-auto"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Exit expanded PDF view' : 'Expand PDF to fullscreen'}
      >
        {expanded ? 'Exit expand' : 'Expand'}
      </button>
    </div>
  )

  const pagesBlock = (
    <div
      ref={scrollContainerRef}
      className={`mx-auto flex flex-col gap-4 ${expanded ? 'max-w-5xl' : 'max-w-3xl'} ${loading && !ready ? 'min-h-[40vh]' : ''}`}
    >
      {pageList.map((page) => (
        <div
          key={`${url}-p${page}-${expanded ? 'x' : 'n'}`}
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
            onClick={(e) => {
              if (placeMode) return
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
  )

  const viewerBody = (
    <>
      {error ? <p className="p-4 text-sm text-warm">{error}</p> : null}
      {loading ? <p className="p-4 text-sm text-muted">Loading document…</p> : null}
      {chrome}
      {pagesBlock}
    </>
  )

  if (expanded) {
    return (
      <>
        <div className={className} aria-hidden>
          <p className="p-4 text-sm text-muted">Expanded view open…</p>
        </div>
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded PDF view"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/15 bg-black/90 px-3 py-2 text-white sm:px-4">
            <span className="text-sm font-medium">Document — expanded</span>
            <button
              type="button"
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-white/10 px-3 text-lg font-semibold text-white hover:bg-white/20"
              onClick={closeExpanded}
              aria-label="Close expanded PDF"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain px-2 py-4 sm:px-4">
            {viewerBody}
          </div>
        </div>
      </>
    )
  }

  return <div className={className}>{viewerBody}</div>
}
