/**
 * Google Analytics 4 helpers.
 *
 * Measurement ID comes from NEXT_PUBLIC_GA_MEASUREMENT_ID (e.g. G-XXXXXXXXXX).
 * When the env var is missing (local without a key, or misconfigured deploy),
 * tracking is a no-op so the site never breaks.
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || ''

export function isGaEnabled(): boolean {
  return GA_MEASUREMENT_ID.length > 0 && GA_MEASUREMENT_ID.startsWith('G-')
}

type GtagFn = (...args: unknown[]) => void

function gtag(): GtagFn | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as Window & { gtag?: GtagFn }
  return typeof w.gtag === 'function' ? w.gtag : undefined
}

/** Fire a custom event (e.g. free_look_started, outbound_email). */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  const fn = gtag()
  if (!fn || !isGaEnabled()) return
  fn('event', name, params)
}
