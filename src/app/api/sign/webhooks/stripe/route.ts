import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getStripe } from '@/lib/sign/stripe'
import { handleStripeEvent } from '@/lib/sign/stripe-webhook'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'Webhook secret not configured.' }, { status: 503 })
  }
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ ok: false, error: 'Missing Stripe-Signature.' }, { status: 400 })
  }

  const rawBody = await request.text()
  try {
    const stripe = getStripe()
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret)
    await handleStripeEvent(stripe, event)
    return NextResponse.json({ ok: true, received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error'
    if (message.toLowerCase().includes('signature')) {
      return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 400 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Webhook handler failed.' }, { status: 500 })
  }
}
