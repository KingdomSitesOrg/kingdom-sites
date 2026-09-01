import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'

/* Site and app drawings, in CSS: bars filling, rows arriving, a highlight
   sweeping, the active tab moving. WebMock and PhoneMock are for a dark band.
   PhoneShot is the light-screen version used where product photos used to sit. */

/* Each drawing has a fixed size here, in the proportions of the real thing: a
   browser window wider than it is tall, a phone about twice as tall as it is
   wide. Callers pick how big it appears with --mock-scale, not a width — handing
   these a width stretched the outline while everything inside stayed put, which
   is what left both of them looking squeezed. */
const WEB_SIZE = { '--mock-w': 360, '--mock-h': 260 } as CSSProperties
const PHONE_SIZE = { '--mock-w': 116, '--mock-h': 260 } as CSSProperties
/* Light phone screens that stand in for product screenshots on a light page. */
const SHOT_SIZE = { '--mock-w': 148, '--mock-h': 312 } as CSSProperties

export type PhoneShotVariant = 'spend' | 'queue' | 'cards'

export function WebMock({ className = '' }: { className?: string }) {
  return (
    <div className={`mock-scale ${className}`} style={WEB_SIZE} aria-hidden="true">
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-white/25" />
          <span className="h-2 w-2 rounded-full bg-white/25" />
          <span className="h-2 w-2 rounded-full bg-white/25" />
          <span className="ml-3 h-3 w-40 rounded-full bg-white/10" />
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between">
            <span className="h-2.5 w-20 rounded-full bg-white/30" />
            <span className="flex items-center gap-2.5">
              <span className="h-2 w-10 rounded-full bg-white/15" />
              <span className="h-2 w-10 rounded-full bg-white/15" />
              <span className="h-4 w-16 rounded-full bg-accent" />
            </span>
          </div>

          <div className="mock-sweep mt-3 flex flex-1 flex-col justify-center rounded-lg bg-white/[0.06] p-3">
            <span className="mock-bar block h-3 w-3/5 rounded-full bg-white/35" />
            <span className="mock-bar mt-2 block h-2 w-4/5 rounded-full bg-white/18" style={{ animationDelay: '0.2s' }} />
            <span className="mock-bar mt-1.5 block h-2 w-2/3 rounded-full bg-white/18" style={{ animationDelay: '0.4s' }} />
            <span className="mt-2.5 block h-4 w-24 rounded-full bg-accent" />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="rounded-md border border-white/10 p-2">
                <span className="block h-7 w-full rounded bg-white/[0.06]" />
                <span
                  className="mock-bar mt-2 block h-2 w-full rounded-full bg-white/20"
                  style={{ animationDelay: `${0.3 + i * 0.25}s` }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PhoneMock({ className = '' }: { className?: string }) {
  return (
    <div className={`mock-scale ${className}`} style={PHONE_SIZE} aria-hidden="true">
      <div className="flex flex-col overflow-hidden rounded-[28px] border-[3px] border-white/25 bg-[#0f1626] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <div className="relative bg-white/[0.05] px-3 pb-2 pt-4">
          <span className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/60" />
          <span className="mt-2.5 block h-2 w-16 rounded-full bg-white/30" />
        </div>
        <div className="flex-1 px-3 py-3">
          <div className="mock-sweep rounded-lg bg-accent p-2.5">
            <span className="block h-1.5 w-10 rounded-full bg-white/50" />
            <span className="mt-1.5 block h-2.5 w-16 rounded-full bg-white/85" />
          </div>
          <div className="mt-3 space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="mock-row flex items-center gap-2" style={{ animationDelay: `${i * 0.45}s` }}>
                <span className="h-5 w-5 shrink-0 rounded-md bg-white/12" />
                <span className="flex-1">
                  <span className="block h-1.5 w-full rounded-full bg-white/22" />
                  <span className="mt-1 block h-1.5 w-2/3 rounded-full bg-white/12" />
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-around border-t border-white/10 px-3 py-2.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="mock-tab h-1.5 w-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 2}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* Light iPhone-shaped screens for the app cluster. Abstract bars and rows —
   not a copy of any real product UI. Same mock-bar / mock-row / mock-sweep
   loops as the dark drawings. */

function PhoneChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[32px] border border-line bg-[#f7f8fb] shadow-[0_18px_44px_rgba(16,23,37,0.16)]">
      <div className="relative px-3.5 pb-1 pt-3">
        <span className="absolute left-1/2 top-1.5 h-3.5 w-[58px] -translate-x-1/2 rounded-full bg-ink" />
        <div className="mt-3 flex items-center justify-between">
          <span className="h-1.5 w-7 rounded-full bg-ink/20" />
          <span className="h-1.5 w-9 rounded-full bg-ink/12" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-3 pt-1.5">{children}</div>
      <div className="flex justify-around border-t border-line px-3 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="mock-tab h-1.5 w-1.5 rounded-full bg-accent"
            style={{ animationDelay: `${i * 2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function SpendInterior() {
  return (
    <>
      <span className="mb-3 block h-2 w-20 rounded-full bg-ink/35" />
      {[
        { tone: 'bg-accent', fill: 'w-[78%]' },
        { tone: 'bg-warm', fill: 'w-[54%]' },
        { tone: 'bg-ink/45', fill: 'w-[66%]' },
        { tone: 'bg-muted', fill: 'w-[40%]' },
      ].map((row, i) => (
        <span key={i} className="mb-2.5 block">
          <span className="mb-1 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.tone}`} />
            <span className="h-1.5 w-10 rounded-full bg-ink/20" />
          </span>
          <span className="block h-2 overflow-hidden rounded-full bg-ink/[0.08]">
            <span
              className={`mock-bar block h-full ${row.fill} rounded-full ${row.tone} opacity-70`}
              style={{ animationDelay: `${i * 0.22}s` }}
            />
          </span>
        </span>
      ))}
      <div className="mock-sweep on-light mt-auto mb-2 rounded-xl bg-accent/[0.1] p-2.5">
        <span className="block h-1.5 w-12 rounded-full bg-accent/50" />
        <span className="mock-bar mt-2 block h-2.5 w-3/5 rounded-full bg-accent/55" />
      </div>
    </>
  )
}

function QueueInterior() {
  return (
    <>
      <div className="mock-sweep on-light rounded-xl bg-accent p-2.5">
        <span className="block h-1.5 w-10 rounded-full bg-white/55" />
        <span className="mt-1.5 block h-2.5 w-16 rounded-full bg-white" />
      </div>
      <div className="mt-2.5 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5">
            <span className="h-5 w-5 shrink-0 rounded-md bg-accent/15" />
            <span className="min-w-0 flex-1">
              <span
                className="mock-bar block h-1.5 w-full rounded-full bg-ink/25"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
              <span className="mt-1 block h-1.5 w-2/3 rounded-full bg-ink/10" />
            </span>
          </span>
        ))}
      </div>
    </>
  )
}

function CardsInterior() {
  return (
    <>
      <div className="mock-sweep on-light rounded-xl border border-line bg-white p-2.5">
        <span className="block h-14 w-full rounded-lg bg-accent/20" />
        <span className="mock-bar mt-2 block h-2 w-2/3 rounded-full bg-ink/30" />
        <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-ink/12" />
      </div>
      <div className="mt-2 space-y-2">
        {[0, 1].map((i) => (
          <span key={i} className="block rounded-xl border border-line bg-white p-2.5">
            <span
              className="mock-bar block h-1.5 w-3/5 rounded-full bg-ink/25"
              style={{ animationDelay: `${0.25 + i * 0.3}s` }}
            />
            <span className="mt-1.5 block h-1.5 w-2/5 rounded-full bg-ink/10" />
          </span>
        ))}
      </div>
    </>
  )
}

const INTERIORS: Record<PhoneShotVariant, () => ReactNode> = {
  spend: SpendInterior,
  queue: QueueInterior,
  cards: CardsInterior,
}

export function PhoneShot({
  variant,
  className = '',
}: {
  variant: PhoneShotVariant
  className?: string
}) {
  const Interior = INTERIORS[variant]
  return (
    <div className={`mock-scale ${className}`} style={SHOT_SIZE} aria-hidden="true">
      <PhoneChrome>
        <Interior />
      </PhoneChrome>
    </div>
  )
}

export function PhoneShotCluster({
  items,
}: {
  items: { variant: PhoneShotVariant; href?: string; name?: string }[]
}) {
  return (
    <div className="flex items-end justify-center self-start pb-4">
      {items.map((item, i) => {
        const middle = i === 1
        const frameClass = middle
          ? 'z-10 [--mock-scale:1.22] sm:[--mock-scale:1.48]'
          : `translate-y-4 [--mock-scale:0.88] sm:[--mock-scale:1.08] ${i === 0 ? '-mr-3 sm:-mr-5' : '-ml-3 sm:-ml-5'}`
        const shot = <PhoneShot variant={item.variant} />
        if (item.href) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.name ?? item.variant}
              className={`relative block ${frameClass}`}
            >
              {shot}
            </Link>
          )
        }
        return (
          <div key={`${item.variant}-${i}`} className={frameClass}>
            {shot}
          </div>
        )
      })}
    </div>
  )
}
