/* A site and an app, drawn in CSS and quietly animating: bars filling, rows
   arriving, a highlight sweeping the hero block, the active tab moving. Both are
   built for a dark background — they appear on the software side of the site and
   on the chooser at the front door. */

/* No width of their own: every caller sets one. A width baked in here fought
   with the width passed in, and which one won came down to stylesheet order —
   which is how these ended up cut off on a phone. */
export function WebMock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="ml-2 h-2.5 w-24 rounded-full bg-white/10" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="h-2 w-14 rounded-full bg-white/30" />
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-7 rounded-full bg-white/15" />
            <span className="h-1.5 w-7 rounded-full bg-white/15" />
            <span className="h-3.5 w-11 rounded-full bg-accent" />
          </span>
        </div>

        <div className="mock-sweep mt-3.5 rounded-lg bg-white/[0.06] p-4">
          <span className="mock-bar block h-2.5 w-3/5 rounded-full bg-white/35" />
          <span className="mock-bar mt-2 block h-1.5 w-4/5 rounded-full bg-white/18" style={{ animationDelay: '0.2s' }} />
          <span className="mock-bar mt-1.5 block h-1.5 w-2/3 rounded-full bg-white/18" style={{ animationDelay: '0.4s' }} />
          <span className="mt-3 block h-3.5 w-16 rounded-full bg-accent" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="rounded-md border border-white/10 p-2">
              <span className="block h-6 w-full rounded bg-white/[0.06]" />
              <span
                className="mock-bar mt-2 block h-1.5 w-full rounded-full bg-white/20"
                style={{ animationDelay: `${0.3 + i * 0.25}s` }}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PhoneMock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[26px] border-[3px] border-white/25 bg-[#0f1626] shadow-[0_24px_60px_rgba(0,0,0,0.5)] ${className}`}
      aria-hidden="true"
    >
      <div className="relative bg-white/[0.05] px-3 pb-2 pt-3.5">
        <span className="absolute left-1/2 top-1.5 h-1.5 w-9 -translate-x-1/2 rounded-full bg-black/60" />
        <span className="mt-2 block h-2 w-14 rounded-full bg-white/30" />
      </div>
      <div className="flex-1 px-3 py-3">
        <div className="mock-sweep rounded-lg bg-accent p-2.5">
          <span className="block h-1.5 w-9 rounded-full bg-white/50" />
          <span className="mt-1.5 block h-2.5 w-14 rounded-full bg-white/85" />
        </div>
        <div className="mt-2.5 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="mock-row flex items-center gap-1.5" style={{ animationDelay: `${i * 0.45}s` }}>
              <span className="h-4 w-4 shrink-0 rounded-md bg-white/12" />
              <span className="flex-1">
                <span className="block h-1.5 w-full rounded-full bg-white/22" />
                <span className="mt-1 block h-1.5 w-2/3 rounded-full bg-white/12" />
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-around border-t border-white/10 px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="mock-tab h-1.5 w-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 2}s` }} />
        ))}
      </div>
    </div>
  )
}
