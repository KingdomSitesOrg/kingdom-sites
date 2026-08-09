import type { Metadata } from 'next'
import Link from 'next/link'
import InquiryForm from '@/components/InquiryForm'
import { CONTACT_EMAIL, CONTACT_MAILTO, SALES_EMAIL, SALES_MAILTO, SALES_NAME } from '@/lib/contact'
import {
  AI_PRICE_LABEL,
  ENTRY_PRICE_LABEL,
  NOTICE_LINE,
  PREPAY_LINE,
  TIERS,
} from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'Start an enquiry — product ownership',
  description:
    'Tell me what you are building. I will reply within a day about product ownership fit, complexity band, and next steps — free, no obligation.',
  alternates: { canonical: '/get-started' },
}

const SIDE = [
  {
    title: 'What happens next',
    desc: 'I read every enquiry myself. If it looks like a fit, we schedule a short call and place you on Focused, Full, or Intensive.',
  },
  {
    title: 'What you are asking for',
    desc: 'A product ownership retainer — someone who owns the product surface with you: features, fixes, releases, and ongoing care.',
  },
  {
    title: 'No long lock-in',
    desc: PREPAY_LINE + ' ' + NOTICE_LINE,
  },
]

export default function GetStarted() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="hero-wash px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Free, no obligation</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Tell me what you are <span className="text-accent">building.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            Product owners and founders with a real feature pipeline — send an enquiry and I will
            come back honestly about fit and which complexity band makes sense.
          </p>
        </div>
      </section>

      <section aria-label="Product ownership enquiry" className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <InquiryForm />

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">Before you write</h2>
            <div className="mt-6 space-y-4">
              {SIDE.map((d) => (
                <div key={d.title} className="tile p-6">
                  <h3 className="text-[15px] font-semibold tracking-tight text-ink">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">{d.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[22px] bg-dark p-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                Typical monthly averages
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                From {ENTRY_PRICE_LABEL}
                <span className="text-base font-medium text-white/50">/month</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {TIERS.map((t) => (
                  <li key={t.id} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-white/75">
                      {t.name}
                      <span className="text-white/40"> — {t.tagline}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-white">
                      ~${t.priceAround.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-white/65">
                Optional AI package from {AI_PRICE_LABEL}/month (you pay your own API costs). Final
                band after we talk.
              </p>
              <Link
                href="/#pricing"
                className="mt-5 inline-block text-sm font-medium text-white underline underline-offset-4"
              >
                Compare ownership bands ›
              </Link>
            </div>

            <p className="mt-8 text-sm leading-relaxed text-body">
              Prefer email? Sales:{' '}
              <a href={SALES_MAILTO} className="link-accent">
                {SALES_NAME} · {SALES_EMAIL}
              </a>
              {' · '}
              Engineering:{' '}
              <a href={CONTACT_MAILTO} className="link-accent">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
