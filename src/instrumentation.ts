import * as Sentry from '@sentry/nextjs'
import type { Instrumentation } from 'next'

import { reportRequestError } from '@/lib/signal'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

// What a page, route or server action threw: to our own crash reports
// (src/lib/signal.ts) and to Sentry, side by side.
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  reportRequestError(error, request, context)
  return Sentry.captureRequestError(error, request, context)
}
