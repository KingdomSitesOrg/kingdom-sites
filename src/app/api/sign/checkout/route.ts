import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getSignPlan, signPlanPriceId, type SignPlanId } from '@/lib/billing'
import { getStripe, newCheckoutIntegrationId } from '@/lib/sign/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function appOrigin(request: Request): string {
  const configured = process.env.SIGN_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (host) return `${proto}://${host}`
  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { plan?: string } | null
    const planId = (body?.plan || '').trim() as SignPlanId
    const plan = getSignPlan(planId)
    if (!plan) {
      return NextResponse.json({ ok: false, error: 'Unknown plan.' }, { status: 400 })
    }
    const priceId = signPlanPriceId(plan)
    if (!priceId) {
      return NextResponse.json(
        {
          ok: false,
          error: `Price not configured (${plan.priceEnv}). Set it in the environment.`,
        },
        { status: 503 },
      )
    }
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'STRIPE_SECRET_KEY is not configured.' },
        { status: 503 },
      )
    }

    const origin = appOrigin(request)
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // Collect email on Checkout (default); do not set payment_method_types.
      success_url: `${origin}/api/sign/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/sign/pricing`,
      metadata: { sign_plan: plan.id },
      subscription_data: {
        metadata: { sign_plan: plan.id },
      },
      integration_identifier: newCheckoutIntegrationId(),
    })

    if (!session.url) {
      return NextResponse.json({ ok: false, error: 'Checkout session missing URL.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ ok: false, error: 'Could not start checkout.' }, { status: 500 })
  }
}
