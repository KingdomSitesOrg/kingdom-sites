'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { SignPlan, SignPlanId } from '@/lib/billing'

type Props = {
  plans: SignPlan[]
  currentPlanId: SignPlanId | null
  status: string | null
  used: number
  limit: number
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
  hasCustomer: boolean
  checkout: string | null
}

/** Choose a plan (Stripe Checkout), upgrade, or open Stripe's billing page. */
export default function AccountBilling(props: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [waiting, setWaiting] = useState(props.checkout === 'done' && !props.currentPlanId)
  const current = props.plans.find((p) => p.id === props.currentPlanId)

  // Back from Stripe: the plan turns on when Stripe tells us (a few seconds).
  useEffect(() => {
    if (!waiting) return
    let tries = 0
    const timer = window.setInterval(async () => {
      tries += 1
      const res = await fetch('/api/sign/billing/status', { cache: 'no-store' }).catch(() => null)
      const data = await res?.json().catch(() => null)
      if (data?.plan || tries >= 15) {
        window.clearInterval(timer)
        setWaiting(false)
        router.refresh()
      }
    }, 2000)
    return () => window.clearInterval(timer)
  }, [waiting, router])

  async function go(path: string, body?: object, key = path) {
    setBusy(key)
    setError('')
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Something went wrong. Try again.')
        setBusy(null)
        return
      }
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      router.refresh()
      setBusy(null)
    } catch {
      setError('No connection. Check your internet and try again.')
      setBusy(null)
    }
  }

  const renews = props.periodEnd ? new Date(props.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''

  return (
    <div className="space-y-4">
      {props.checkout === 'cancelled' ? (
        <p className="text-sm text-body">Checkout was cancelled. Nothing was charged.</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-warm">
          {error}
        </p>
      ) : null}

      {waiting ? (
        <div role="status" className="tile p-5 text-sm text-body">
          Payment received. Turning on your plan…
        </div>
      ) : current ? (
        <div className="tile space-y-3 p-5">
          <h2 className="text-lg font-semibold text-ink">{current.name}</h2>
          <p className="text-sm text-body">
            {props.used} of {props.limit} documents sent this month.
            {renews
              ? props.cancelAtPeriodEnd
                ? ` Ends on ${renews}; it will not renew.`
                : ` Renews on ${renews}.`
              : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/sign/new" className="btn-primary !min-h-10 !px-4 !py-2 !text-sm">
              New document
            </Link>
            {current.id === 'starter' ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void go('/api/sign/billing/upgrade', {}, 'upgrade')}
                className="btn-ghost !min-h-10 !px-4 !py-2 !text-sm"
              >
                {busy === 'upgrade' ? 'Upgrading…' : 'Upgrade to Growth (20 a month)'}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void go('/api/sign/billing/portal', {}, 'portal')}
              className="btn-ghost-sm"
            >
              {busy === 'portal' ? 'Opening…' : 'Card, invoices and cancelling'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {props.status === 'past_due' || props.status === 'unpaid' ? (
            <div className="tile space-y-3 p-5">
              <h2 className="text-lg font-semibold text-ink">Your last payment did not go through</h2>
              <p className="text-sm text-body">Update your card to keep sending documents.</p>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void go('/api/sign/billing/portal', {}, 'portal')}
                className="btn-primary"
              >
                Update card
              </button>
            </div>
          ) : (
            <p className="text-sm text-body">
              Choose a plan to send documents. You can prepare documents before you choose.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {props.plans.map((plan) => (
              <div key={plan.id} className="tile flex flex-col p-5">
                <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  ${plan.priceMonthly}
                  <span className="text-sm font-normal text-muted"> / month</span>
                </p>
                <p className="mt-3 flex-1 text-sm text-body">
                  Send up to <strong>{plan.contractLimit}</strong> documents a month.
                </p>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void go('/api/sign/billing/checkout', { plan: plan.id }, plan.id)}
                  className="btn-primary mt-6 w-full"
                >
                  {busy === plan.id ? 'Opening checkout…' : `Choose ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
