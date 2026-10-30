'use client'

import { useEffect } from 'react'
import { reportError } from '@/lib/report-error'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Not imported at the top: this page is part of every page's code, and
    // Sentry loads after the page settles (instrumentation-client.ts).
    reportError(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h2>
          <button
            onClick={reset}
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '999px', background: '#0071e3', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
