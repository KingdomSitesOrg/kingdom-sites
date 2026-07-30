import type { ReactNode } from 'react'

/* Pure-vector UI mockups — no screenshots, no image files. They mirror the real
   Ruta apps: a light product interface with a dark sidebar (the office web app)
   and light mobile screens (crew app and customer portal). Adapted from Ruta's
   own marketing site so the two stay in step. Decorative only. */

function CheckGlyph({ className = 'h-2.5 w-2.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true">
      <path
        d="M2 6.4 4.7 9 10 3.2"
        fill="none"
        stroke="#15803d"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Chevron() {
  return (
    <svg viewBox="0 0 8 12" className="h-2.5 w-2.5 shrink-0" aria-hidden="true">
      <path d="m2 2 4 4-4 4" fill="none" stroke="#d6d3d1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-[252px] rounded-[2.4rem] border border-white/10 bg-[#0b170b] p-2.5 shadow-[0_44px_110px_-32px_rgba(0,0,0,0.95)] sm:w-[268px]"
    >
      <div className="relative h-[470px] w-full overflow-hidden rounded-[1.9rem] sm:h-[486px]">
        {children}
        <div className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-[#0b170b]" />
      </div>
    </div>
  )
}

/* ---------- The office web app ---------- */

function NavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-md px-1.5 py-[5px] ${active ? 'bg-white/10' : ''}`}>
      <span className={`h-2 w-2 rounded-[2px] ${active ? 'bg-green-400' : 'bg-white/20'}`} />
      <span className={`text-[8.5px] ${active ? 'font-medium text-white' : 'text-white/45'}`}>{label}</span>
    </div>
  )
}

export function BrowserMockup() {
  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b170b] shadow-[0_44px_110px_-32px_rgba(0,0,0,0.95)]"
    >
      <div className="flex h-9 items-center gap-1.5 border-b border-white/[0.06] px-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <div className="ml-3 flex h-5 w-40 items-center rounded-md bg-white/[0.06] px-2">
          <span className="text-[8px] tracking-wide text-white/30">app.getruta.com</span>
        </div>
      </div>

      <div className="flex bg-[#fafaf9]">
        <div className="flex w-[104px] shrink-0 flex-col bg-[#16241b] p-2.5 sm:w-[118px]">
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-green-500 text-[10px] font-extrabold text-[#0a1f0a]">
              R
            </span>
            <span className="text-[11px] font-bold tracking-wide text-white">Ruta</span>
          </div>
          <NavItem label="Home" active />
          <NavItem label="Messages" />
          <div className="mb-1 mt-2.5 px-1.5 text-[6.5px] uppercase tracking-[0.16em] text-white/30">Work</div>
          <NavItem label="Customers" />
          <NavItem label="Services" />
          <NavItem label="Visits" />
          <NavItem label="Dispatch" />
          <NavItem label="Revenue" />
          <div className="mb-1 mt-2.5 px-1.5 text-[6.5px] uppercase tracking-[0.16em] text-white/30">Company</div>
          <NavItem label="Team" />
        </div>

        <div className="min-w-0 flex-1 p-3.5">
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="text-[12px] font-bold text-stone-800">Home</span>
            <span className="text-[8px] text-stone-400">Wed, May 14</span>
          </div>

          <div className="mb-2 grid grid-cols-3 gap-2">
            {[
              ['Completed visits', '5/10', 'text-green-600'],
              ['Revenue', '$3.4k', 'text-stone-800'],
              ['Clocked in', '4/6', 'text-stone-800'],
            ].map(([label, value, tone]) => (
              <div key={label} className="rounded-lg border border-stone-200 bg-white p-2">
                <div className="text-[6.5px] uppercase tracking-wider text-stone-400">{label}</div>
                <div className={`mt-0.5 text-[13px] font-bold ${tone}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="mb-2.5 rounded-lg border border-stone-200 bg-white p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[7px] uppercase tracking-wider text-stone-400">Visit progress</span>
              <span className="text-[7px] font-semibold text-stone-500">50%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div className="h-full w-1/2 rounded-full bg-green-500" />
            </div>
          </div>

          <div className="mb-1.5 text-[7px] uppercase tracking-wider text-stone-400">Immediate actions</div>
          <div className="space-y-1.5">
            {[
              ['Visits ready to dispatch', '8', 'Dispatch'],
              ['Visits requiring review', '3', 'Review'],
              ['Payment issues', '2', 'View'],
            ].map(([label, count, action]) => (
              <div key={label} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-[7px]">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-green-500/15 text-[9px] font-bold text-green-700">
                  {count}
                </span>
                <span className="min-w-0 flex-1 truncate text-[8.5px] font-medium text-stone-700">{label}</span>
                <span className="rounded-md bg-stone-900 px-2 py-1 text-[7px] font-semibold text-white">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneTabs({ items }: { items: [string, boolean][] }) {
  return (
    <div className="flex border-t border-stone-200 bg-white px-2 pb-3 pt-1.5">
      {items.map(([label, active]) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1">
          <span className={`h-3 w-3 rounded-[3px] ${active ? 'bg-green-500' : 'bg-stone-300'}`} />
          <span className={`text-[7px] ${active ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>{label}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- The customer portal ---------- */

export function PhonePortalMockup() {
  return (
    <PhoneFrame>
      <div className="flex h-full flex-col bg-[#fafaf9] pt-7">
        <div className="px-4 pb-0.5">
          <div className="text-[8px] text-stone-400">Good morning</div>
          <div className="text-[14px] font-bold text-stone-800">Sarah Bennett</div>
        </div>

        <div className="mt-2 px-3">
          <div className="mb-1 text-[7px] uppercase tracking-wider text-stone-400">Your services</div>
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-100">
              <CheckGlyph />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[9.5px] font-semibold text-stone-800">Weekly Lawn Care</div>
              <div className="text-[7.5px] text-stone-400">Active · next visit Thursday</div>
            </div>
            <Chevron />
          </div>
        </div>

        <div className="mt-2.5 px-3">
          <div className="mb-1 text-[7px] uppercase tracking-wider text-stone-400">Available services</div>

          <div className="rounded-xl border border-green-300 bg-green-50 p-2.5">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[6.5px] uppercase tracking-wider text-green-700">Recommended for spring</span>
            </div>
            <div className="mt-1 text-[10.5px] font-semibold text-stone-800">Spring Yard Cleanup</div>
            <div className="text-[7.5px] text-stone-500">One-time · clear debris and refresh beds</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-800">
                $140 <span className="text-[7px] font-normal text-stone-400">/ visit</span>
              </span>
              <span className="rounded-lg bg-green-600 px-2.5 py-1 text-[7.5px] font-semibold text-white">
                Request quote
              </span>
            </div>
          </div>

          <div className="mt-1.5 rounded-xl border border-stone-200 bg-white p-2.5">
            <div className="text-[10.5px] font-semibold text-stone-800">Lawn Aeration</div>
            <div className="text-[7.5px] text-stone-500">Seasonal · healthier, greener turf</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-800">
                $90 <span className="text-[7px] font-normal text-stone-400">/ visit</span>
              </span>
              <span className="rounded-lg border border-stone-300 px-2.5 py-1 text-[7.5px] font-semibold text-stone-700">
                Request quote
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1" />
        <PhoneTabs
          items={[
            ['Home', true],
            ['Visits', false],
            ['Messages', false],
          ]}
        />
      </div>
    </PhoneFrame>
  )
}
