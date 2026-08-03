/* A picture of the thing we are actually selling: someone in your town types
   "pressure washing near me", your business is the first one they see, and the
   phone rings. Drawn entirely in CSS — no screenshots, nothing to load. */

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="text-warm">
          <path d="M6 .8l1.6 3.3 3.6.5-2.6 2.5.6 3.6L6 9l-3.2 1.7.6-3.6L.8 4.6l3.6-.5L6 .8z" />
        </svg>
      ))}
    </span>
  )
}

export default function LeadMock({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {/* The search results panel */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_18px_44px_rgba(16,23,37,0.12)]">
        {/* Search bar */}
        <div className="flex items-center gap-2.5 border-b border-line bg-surface-2 px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-muted">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-[12.5px] font-medium text-body">pressure washing near me</span>
        </div>

        <div className="p-3.5">
          {/* The winning result — yours */}
          <div className="rounded-xl border border-accent/35 bg-accent/[0.06] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">Your Business, LLC</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <StarRow />
                  <span className="text-[11px] font-medium text-body">4.9</span>
                  <span className="text-[11px] text-muted">· 87 reviews</span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted">Open now · Serves your whole county</p>
              </div>
              <span className="mock-pulse flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 text-[11px] font-semibold text-white">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3.2 1.3 4.6 3a.8.8 0 0 1-.1 1.1l-.7.6c.5 1 1.4 1.9 2.4 2.4l.6-.7a.8.8 0 0 1 1.1-.1l1.7 1.4c.3.3.4.7.1 1l-.8.9c-.3.3-.7.4-1.1.3C5 9.2 2.8 7 2 4.1c-.1-.4 0-.8.3-1.1l.9-.8c.3-.2.7-.2 1 .1Z" />
                </svg>
                Call
              </span>
            </div>
          </div>

          {/* The competition, greyed out below you */}
          <div className="mt-2 space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl border border-line p-3.5 opacity-55">
                <span className="block h-2 w-28 rounded-full bg-ink/18" />
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-14 rounded-full bg-ink/10" />
                  <span className="h-1.5 w-8 rounded-full bg-ink/[0.07]" />
                </div>
                <span className="mt-2 block h-1.5 w-24 rounded-full bg-ink/[0.07]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The point of all of it — a call coming in, tucked over the corner */}
      <div className="absolute -bottom-5 -right-3 w-[188px] rounded-2xl border border-line bg-surface p-3.5 shadow-[0_20px_44px_rgba(16,23,37,0.18)] sm:-right-6">
        <div className="flex items-center gap-2.5">
          <span className="mock-pulse flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/12">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" className="text-accent">
              <path d="M3.2 1.3 4.6 3a.8.8 0 0 1-.1 1.1l-.7.6c.5 1 1.4 1.9 2.4 2.4l.6-.7a.8.8 0 0 1 1.1-.1l1.7 1.4c.3.3.4.7.1 1l-.8.9c-.3.3-.7.4-1.1.3C5 9.2 2.8 7 2 4.1c-.1-.4 0-.8.3-1.1l.9-.8c.3-.2.7-.2 1 .1Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Incoming</p>
            <p className="truncate text-[12.5px] font-semibold text-ink">New customer</p>
          </div>
        </div>
      </div>
    </div>
  )
}
