import type { CSSProperties } from 'react'

/* A site and an app, drawn in CSS and quietly animating: bars filling, rows
   arriving, a highlight sweeping the hero block, the active tab moving. Both are
   built for a dark background — they appear on the software side of the site and
   on the chooser at the front door. */

/* Each drawing has a fixed size here, in the proportions of the real thing: a
   browser window wider than it is tall, a phone about twice as tall as it is
   wide. Callers pick how big it appears with --mock-scale, not a width — handing
   these a width stretched the outline while everything inside stayed put, which
   is what left both of them looking squeezed. */
const WEB_SIZE = { '--mock-w': 360, '--mock-h': 260 } as CSSProperties
const PHONE_SIZE = { '--mock-w': 116, '--mock-h': 260 } as CSSProperties

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
