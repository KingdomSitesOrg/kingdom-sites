'use client'

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react'

type Props = {
  url: string
  pageCount: number
  focusPage?: number
  className?: string
  renderPageOverlay?: (page: number) => ReactNode
  onPageClick?: (page: number, e: MouseEvent<HTMLDivElement>) => void
  placeMode?: boolean
}

export default function PdfScrollViewer({
  url,
  pageCount,
  focusPage,
  className,
  renderPageOverlay,
  onPageClick,
  placeMode,
}: Props) {
  const [pages, setPages] = useState(pageCount)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const docRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setLoading(true)
    setError('')

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

        // Wait for React to mount one canvas per page
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
        if (cancelled) return

        for (let i = 1; i <= total; i++) {
          const page = await pdf.getPage(i)
          if (cancelled) return
          // Retry briefly if ref not ready yet
          let canvas = canvasRefs.current[i - 1]
          for (let attempt = 0; attempt < 10 && !canvas; attempt++) {
            await new Promise((r) => setTimeout(r, 16))
            canvas = canvasRefs.current[i - 1]
          }
          if (!canvas) continue

          const base = page.getViewport({ scale: 1 })
          const parentWidth = canvas.parentElement?.clientWidth || 720
          const targetWidth = Math.max(280, Math.min(720, parentWidth))
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
      try {
        docRef.current?.destroy()
      } catch {
        /* ignore */
      }
      docRef.current = null
    }
  }, [url])

  useEffect(() => {
    if (!focusPage || !ready) return
    const el = pageRefs.current[focusPage - 1]
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focusPage, ready])

  const pageList = Array.from({ length: pages }, (_, i) => i + 1)

  return (
    <div className={className}>
      {error ? <p className="p-4 text-sm text-warm">{error}</p> : null}
      {loading ? <p className="p-4 text-sm text-muted">Loading document…</p> : null}
      <div className={`mx-auto flex max-w-3xl flex-col gap-4 ${loading && !ready ? 'min-h-[40vh]' : ''}`}>
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
              className={`absolute inset-0 ${
                placeMode ? 'cursor-crosshair' : ''
              }`}
              onClick={(e) => {
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
