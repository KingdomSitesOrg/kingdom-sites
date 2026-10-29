'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  PAYOUT_METHODS,
  STAGES,
  payoutLabel,
  payoutLink,
  shareLink,
  trackerLink,
  type PayoutMethod,
  type StageKey,
} from '@/lib/referrals'
import type { Referred, Referrer, ReferralsDoc } from '@/lib/refer/store'
import CopyRow from '@/app/refer/CopyRow'

/**
 * The referrals console (T-293): each referrer, how they want to be paid
 * (with Copy, and Open for Venmo or paypal.me), and everyone they sent with
 * its stage buttons in order: Call booked → Call held → Mark $20 paid →
 * Signed → First payment cleared → Mark $500 paid. Each tap records a date;
 * Undo takes the latest one back. Nothing here sends money.
 */

const day = (at: string) =>
  new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const STAGE_FIELD: Record<StageKey, keyof Referred> = {
  callBooked: 'callBookedAt',
  callHeld: 'callHeldAt',
  callPaid: 'callPaidAt',
  signed: 'signedAt',
  firstPayment: 'firstPaymentAt',
  joinPaid: 'joinPaidAt',
}

const DONE_WORDS: Record<StageKey, string> = {
  callBooked: 'Call booked',
  callHeld: 'Call held',
  callPaid: '$20 paid',
  signed: 'Signed',
  firstPayment: 'First payment cleared',
  joinPaid: '$500 paid',
}

async function send(body: Record<string, unknown>) {
  const response = await fetch('/api/refer/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
  if (!response.ok || !data.ok) throw new Error(data.error || 'That did not save. Try again.')
}

/** `origin` is this site's address, for the share and tracker links. */
export default function ReferralsAdmin({ doc, origin }: { doc: ReferralsDoc; origin: string }) {

  if (!doc.referrers.length) {
    return <p className="text-body">No referrers yet. They sign up at /refer.</p>
  }
  const referrers = [...doc.referrers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <ul className="flex flex-col gap-6">
      {referrers.map((referrer) => (
        <ReferrerCard
          key={referrer.code}
          referrer={referrer}
          referred={doc.referred
            .filter((r) => r.code === referrer.code)
            .sort((a, b) => b.at.localeCompare(a.at))}
          origin={origin}
        />
      ))}
    </ul>
  )
}

function ReferrerCard({
  referrer,
  referred,
  origin,
}: {
  referrer: Referrer
  referred: Referred[]
  origin: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const payout = referrer.payout
  const open = payout ? payoutLink(payout.method, payout.handle) : null

  return (
    <li className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink [overflow-wrap:anywhere]">{referrer.name}</h2>
          <p className="text-sm text-body [overflow-wrap:anywhere]">
            {referrer.email} · since {day(referrer.createdAt)}
            {referrer.showName ? ' · first name shown on their link' : ''}
          </p>
        </div>
        <button
          type="button"
          className="btn-danger-sm"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm(`Remove ${referrer.name} and everyone they referred?`)) return
            setBusy(true)
            setError('')
            try {
              await send({ action: 'remove', code: referrer.code })
              router.refresh()
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        >
          Remove
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Pay by {payout ? payoutLabel(payout.method) : '(not chosen yet)'}</span>
          {payout ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <CopyRow value={payout.handle} label={`${referrer.name}'s ${payoutLabel(payout.method)}`} />
              </div>
              {open ? (
                <a href={open} target="_blank" rel="noopener noreferrer" className="btn-ghost-sm">
                  Open {payoutLabel(payout.method)}
                </a>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-body">They choose on their private tracker.</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Their private tracker (send it if they lost it)</span>
          <CopyRow value={trackerLink(origin, referrer.trackerToken)} label={`${referrer.name}'s tracker`} />
          <span className="text-sm text-muted [overflow-wrap:anywhere]">
            Share link: {shareLink(origin, referrer.code)}
          </span>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-semibold text-ink" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3">
        {referred.length ? (
          referred.map((lead) => <LeadRow key={lead.id} lead={lead} chosen={payout?.method} />)
        ) : (
          <p className="text-sm text-muted">No one referred yet.</p>
        )}
      </div>
    </li>
  )
}

function LeadRow({ lead, chosen }: { lead: Referred; chosen: PayoutMethod | undefined }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [via, setVia] = useState<PayoutMethod>(chosen ?? 'venmo')

  const doneStages = STAGES.filter((s) => lead[STAGE_FIELD[s.key]])
  const next = STAGES.find((s) => !lead[STAGE_FIELD[s.key]])
  const last = doneStages[doneStages.length - 1]
  const ended = Boolean(lead.endedAt)

  const run = async (body: Record<string, unknown>) => {
    setBusy(true)
    setError('')
    try {
      await send({ action: 'stage', id: lead.id, ...body })
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const paidVia = (key: StageKey) =>
    key === 'callPaid' ? lead.callPaidVia : key === 'joinPaid' ? lead.joinPaidVia : undefined

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-canvas p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-ink [overflow-wrap:anywhere]">
          {lead.name}
          {ended ? <span className="ml-2 text-sm font-normal text-muted">Not going ahead</span> : null}
        </p>
        <span className="text-sm text-muted">
          {lead.via === 'link' ? 'Came through their link' : 'Told about on /refer'} · {day(lead.at)}
        </span>
      </div>
      {lead.contactName || lead.contactEmail || lead.website || lead.note ? (
        <p className="text-sm text-body [overflow-wrap:anywhere]">
          {[lead.contactName, lead.contactEmail, lead.website].filter(Boolean).join(' · ')}
          {lead.note ? <span className="block">{lead.note}</span> : null}
        </p>
      ) : null}

      {doneStages.length ? (
        <ol className="flex flex-wrap gap-2 text-sm">
          {doneStages.map((s) => {
            const how = payoutLabel(paidVia(s.key))
            return (
              <li key={s.key} className="rounded-full bg-surface px-3 py-1 text-ink">
                ✓ {DONE_WORDS[s.key]}
                {how ? ` by ${how}` : ''} · {day(lead[STAGE_FIELD[s.key]] as string)}
              </li>
            )
          })}
        </ol>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {next && !ended ? (
          <>
            {next.key === 'callPaid' || next.key === 'joinPaid' ? (
              <select
                value={via}
                onChange={(e) => setVia(e.target.value as PayoutMethod)}
                aria-label="How you sent it"
                className="min-h-10 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
              >
                {PAYOUT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    Sent by {m.label}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              className="btn-sm"
              disabled={busy}
              onClick={() =>
                run({
                  stage: next.key,
                  on: true,
                  ...(next.key === 'callPaid' || next.key === 'joinPaid' ? { via } : {}),
                })
              }
            >
              {next.button}
            </button>
          </>
        ) : null}
        {!next ? <span className="text-sm font-medium text-ink">All done.</span> : null}
        {last ? (
          <button
            type="button"
            className="btn-ghost-sm"
            disabled={busy}
            onClick={() => run({ stage: last.key, on: false })}
          >
            Undo {DONE_WORDS[last.key]}
          </button>
        ) : null}
        <button
          type="button"
          className="btn-ghost-sm"
          disabled={busy}
          onClick={() => run({ stage: 'ended', on: !ended })}
        >
          {ended ? 'Going ahead after all' : 'Not going ahead'}
        </button>
      </div>
      {error ? (
        <p className="text-sm font-semibold text-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
