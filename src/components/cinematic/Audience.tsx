import Image from 'next/image'
import Link from 'next/link'
import CaseTitle from './CaseTitle'
import Scroll from './Scroll'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { ONE_ENGINEER, PRICE_GUIDE } from '@/lib/partnership'
import { faqLd, jsonLd, type Faq } from '@/lib/seo'
import { STEPS, type Shot } from '@/lib/work'

/**
 * The pieces the pages for a kind of client share (Rochester businesses,
 * churches, schools; T-387). Every one is drawn from what the Portfolio and
 * home page already use, so these pages wear the same look.
 */

export type Proof = { href: string; name: string; label: string; line: string; card: Shot }

/* Work to point at: the Portfolio page's cards (a picture, a name, a line). */
export function ProofCards({ items }: { items: Proof[] }) {
  return (
    <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2">
      {items.map((p) => {
        const external = p.href.startsWith('http')
        return (
          <Scroll key={p.name} className="flex">
            <a
              href={p.href}
              className="cn-reveal cn-case group block"
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <span className="cn-shot cn-case-frame">
                <Image src={p.card.src} alt={p.card.alt} width={p.card.w} height={p.card.h} loading="lazy" unoptimized />
              </span>
              <p className="cn-dim mt-6 text-sm">{p.label}</p>
              <h3 className="cn-display cn-h3 cn-case-name mt-2">
                <CaseTitle name={p.name} />
              </h3>
              <p className="cn-body cn-case-line mt-3 text-[1.02rem]">{p.line}</p>
            </a>
          </Scroll>
        )
      })}
    </div>
  )
}

/* Short blocks of what a client usually needs, two by two. */
export function Needs({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2">
      {items.map((x) => (
        <div key={x.title} className="cn-card">
          <h3 className="cn-display cn-h3">{x.title}</h3>
          <p className="cn-body mt-4 max-w-[44ch]">{x.body}</p>
        </div>
      ))}
    </div>
  )
}

/* How working together starts: the four steps the site already gives. */
export function HowItStarts({ id = 'how' }: { id?: string }) {
  return (
    <section aria-labelledby={id} className="cn-wrap mt-28 sm:mt-40">
      <p className="cn-kicker">How it starts</p>
      <h2 id={id} className="cn-display cn-h2 mt-5">You talk to me first.</h2>
      <ol className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="cn-card">
            <p className="cn-kicker">{String(i + 1).padStart(2, '0')}</p>
            <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--fg)]">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#cfcbc3]">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* Questions people ask, answered on the page, and the same words as FAQ data
   for search engines. */
export function Questions({ items, id = 'questions' }: { items: Faq[]; id?: string }) {
  return (
    <section aria-labelledby={id} className="cn-wrap mt-28 sm:mt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd(items)) }} />
      <p className="cn-kicker">Questions</p>
      <h2 id={id} className="cn-display cn-h2 mt-5">What people ask.</h2>
      <dl className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2">
        {items.map(({ q, a }) => (
          <div key={q} className="cn-card">
            <dt className="text-lg font-semibold tracking-tight text-[var(--fg)]">{q}</dt>
            <dd className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-[#cfcbc3]">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* The closing call every studio page ends on (T-387): one heading, one line,
   the one button, and the email for people who would rather write. */
export function Close({
  title,
  body,
  secondary,
}: {
  title: string
  body: string
  secondary?: { href: string; label: string }
}) {
  return (
    <section aria-label="Start a conversation" className="cn-wrap pb-28 pt-36 text-center sm:pb-40 sm:pt-48">
      <h2 className="cn-display cn-h1 mx-auto max-w-[12ch] text-balance">{title}</h2>
      <p className="cn-body mx-auto mt-6 max-w-[40ch]">{body}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href={INQUIRE_PATH} className="cn-btn">
          {INQUIRE_CTA} <span aria-hidden="true">→</span>
        </Link>
        {secondary ? (
          <Link href={secondary.href} className="cn-ghost">
            {secondary.label}
          </Link>
        ) : null}
      </div>
      <p className="mx-auto mt-6 max-w-[44ch] text-[15px] leading-relaxed text-[var(--dim)]">
        Or write to{' '}
        <a href={CONTACT_MAILTO} className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
          {CONTACT_EMAIL}
        </a>
        . Every enquiry comes to me, and I reply personally.
      </p>
    </section>
  )
}

/* Why one engineer instead of an agency (home and Get started). */
export function OneEngineer({ className = 'cn-wrap mt-28 sm:mt-40' }: { className?: string }) {
  return (
    <section aria-labelledby="one-engineer" className={className}>
      <p className="cn-kicker">{ONE_ENGINEER.kicker}</p>
      <h2 id="one-engineer" className="cn-display cn-h2 mt-5 max-w-[14ch]">
        {ONE_ENGINEER.title}
      </h2>
      <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-3">
        {ONE_ENGINEER.points.map((x) => (
          <div key={x.title} className="cn-card">
            <h3 className="cn-display cn-h3">{x.title}</h3>
            <p className="cn-body mt-4 max-w-[40ch]">{x.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* The rough price ranges, as the chat gives them, never a quote. */
export function PriceGuide({ className }: { className?: string }) {
  return (
    <div className={className}>
      <h2 className="cn-kicker">{PRICE_GUIDE.title}</h2>
      <dl className="mt-4 grid gap-0">
        {PRICE_GUIDE.rows.map((r) => (
          <div key={r.what} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-[var(--line)] py-3">
            <dt className="text-[15px] font-medium text-[var(--fg)]">{r.what}</dt>
            <dd className="text-[15px] text-[#cfcbc3]">{r.price}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-[var(--line)] pt-3 text-[14px] leading-relaxed text-[var(--dim)]">{PRICE_GUIDE.note}</p>
    </div>
  )
}

/* The other pages for a kind of client, so each one leads to the rest. */
export const AUDIENCE_PAGES = [
  { href: '/rochester-mn', label: 'Rochester businesses' },
  { href: '/churches', label: 'Churches and ministries' },
  { href: '/schools', label: 'Schools and teachers' },
  { href: '/ai-tooling', label: 'AI consultation' },
]

export function OtherPages({ here }: { here: string }) {
  return (
    <nav aria-label="Who I work with" className="cn-wrap mt-20">
      <p className="cn-kicker">Who I work with</p>
      <p className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
        {AUDIENCE_PAGES.filter((p) => p.href !== here).map((p) => (
          <Link key={p.href} href={p.href} className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
            {p.label}
          </Link>
        ))}
        <Link href="/portfolio" className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
          Portfolio
        </Link>
      </p>
    </nav>
  )
}
