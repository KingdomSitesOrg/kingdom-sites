import Link from 'next/link'
import type { Metadata } from 'next'
import LeadMock from '@/components/LeadMock'
import { WebMock, PhoneMock } from '@/components/BuildMocks'
import { ENTRY_PRICE_LABEL } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Kingdom Sites — growth for local businesses, and custom software',
  description:
    'Two ways in: an ongoing partnership that gets a local business found and called, or custom websites, apps and internal software built to order.',
  alternates: { canonical: '/' },
}

function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The front door. Two doors, really — the two halves of the business are sold to
 * completely different people, and asking one question up front is kinder than
 * making a pressure washer wade through talk of platforms and AI to find the
 * thing that is actually for him.
 *
 * Side by side on a desktop, stacked on a phone. Each half is one big link, so
 * anywhere you click or tap counts.
 */
export default function Chooser() {
  return (
    <div className="relative flex min-h-[100svh] flex-col">
      {/* The wordmark sits over the join between the two halves. */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center pt-6 sm:pt-8">
        <span className="rounded-full bg-white/85 px-5 py-2 text-[15px] font-semibold tracking-tight text-ink shadow-[0_6px_20px_rgba(16,23,37,0.12)] backdrop-blur">
          Kingdom Sites
        </span>
      </div>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        {/* Growth for a local business */}
        <Link
          href="/grow"
          className="group relative flex min-h-[50svh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center transition-colors duration-300 hover:bg-[#e8f0fb] sm:px-10 md:min-h-[100svh] md:py-24"
          style={{ background: 'linear-gradient(180deg, #eef4fc 0%, #f5f7fa 100%)' }}
        >
          <div className="relative z-10 flex max-w-md flex-col items-center">
            <p className="eyebrow">For local businesses</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {'Small business looking for '}
              <span className="text-accent">growth?</span>
            </h2>
            <p className="mt-5 text-pretty text-[15px] leading-relaxed text-body sm:text-base">
              {'I get you found on Google and the phone ringing — website, listing, local search, reviews — for one monthly fee. Pressure washing, landscaping, cafés, salons, anything local.'}
            </p>

            {/* Both halves give their drawing the same height, so the two
                buttons line up across the join rather than sitting at
                different heights on a wide screen. */}
            <div className="mt-9 flex h-[290px] w-full items-center justify-center sm:h-[344px]">
              <div className="w-full max-w-[240px] sm:max-w-[286px]">
                <LeadMock />
              </div>
            </div>

            <span className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white shadow-[0_10px_28px_rgba(10,99,201,0.28)] transition-transform duration-300 group-hover:-translate-y-0.5 sm:text-lg">
              Grow my business
              <Arrow />
            </span>
            <span className="mt-4 text-[13px] text-muted">
              {'From ' + ENTRY_PRICE_LABEL + '/month · First month free'}
            </span>
          </div>
        </Link>

        {/* Custom software */}
        <Link
          href="/software"
          className="group relative flex min-h-[50svh] flex-col items-center justify-center overflow-hidden bg-dark px-6 py-20 text-center transition-colors duration-300 hover:bg-[#0c1523] sm:px-10 md:min-h-[100svh] md:py-24"
        >
          <div className="relative z-10 flex max-w-md flex-col items-center">
            <p className="eyebrow">For teams and founders</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {'Need custom software '}
              <span className="text-[#f0b48c]">built?</span>
            </h2>
            <p className="mt-5 text-pretty text-[15px] leading-relaxed text-white/65 sm:text-base">
              {'Websites, mobile apps, the internal system your company runs on, and AI built into the product. Scoped, built and supported by one developer.'}
            </p>

            <div className="mt-9 flex h-[290px] w-full items-center justify-center gap-5 sm:h-[344px]">
              <WebMock className="w-[176px] sm:w-[210px]" />
              <PhoneMock className="w-[86px] sm:w-[104px]" />
            </div>

            <span className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-medium text-dark shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:-translate-y-0.5 sm:text-lg">
              See what I build
              <Arrow />
            </span>
            <span className="mt-4 text-[13px] text-white/45">
              Web · iOS &amp; Android · Internal platforms · AI
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}
