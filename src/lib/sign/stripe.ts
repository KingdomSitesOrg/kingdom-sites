import Stripe from 'stripe'

/** Pinned per product house rule (SDK default may be newer). */
export const SIGN_STRIPE_API_VERSION = '2026-07-29.dahlia' as Stripe.LatestApiVersion

let client: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!client) {
    client = new Stripe(key, {
      apiVersion: SIGN_STRIPE_API_VERSION,
      typescript: true,
    })
  }
  return client
}

/** Test helper — reset singleton between vitest cases. */
export function resetStripeClientForTests(): void {
  client = null
}

export function newCheckoutIntegrationId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  let suffix = ''
  for (let i = 0; i < 8; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `sign-sub-${suffix}`
}
