import type { Metadata } from 'next'
import { SITE_OG_IMAGE, SHARE_URL, type Faq } from '@/lib/seo'
import Link from 'next/link'
import CalendlyEmbed from '@/components/CalendlyEmbed'
import EvenGrid from '@/components/EvenGrid'
import { Close, OtherPages, Questions } from '@/components/cinematic/Audience'
import { CALENDLY_AI_URL, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import {
  AI_CONSULT,
  AI_CONSULT_FOR,
  AI_CONSULT_LEAVE,
  AI_CONSULT_PROOF,
  AI_CONSULT_SESSION,
  AI_CONSULT_START,
  AI_CONSULT_TOPICS,
} from '@/lib/partnership'

const DESCRIPTION =
  'AI consultation and hands-on AI training for businesses, teams and developers: where AI fits your work, set up on your own tools. With Thomas Klein.'

const QUESTIONS: Faq[] = [
  {
    q: 'Do I need to be technical?',
    a: 'No. Sessions are for developers, admins and anyone exploring AI past the chat box, and they start from your work, not from the tools.',
  },
  {
    q: 'Can you build AI into our app or website?',
    a: 'Yes. If your product needs AI inside it, such as answers from your own data or actions with a person in the loop, I build that into the app itself. I built the chat on this site the same way.',
  },
]

export const metadata: Metadata = {
  title: 'AI consultation for businesses and teams',
  description: DESCRIPTION,
  alternates: { canonical: '/ai-tooling' },
  openGraph: {
    title: 'AI consultation — Kingdom Sites',
    description: DESCRIPTION,
    url: `${SHARE_URL}/ai-tooling`,
    siteName: 'Kingdom Sites',
    locale: 'en_US',
    type: 'website',
    images: [SITE_OG_IMAGE],
  },
}

export default function AiTooling() {
  return (
    <div className="w-full overflow-x-hidden">
      <section className="cn-wrap pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="self-start">
            <p className="cn-kicker cn-rise">AI consultation</p>
            <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">
              {AI_CONSULT.pageTitle}
            </h1>
            <p className="cn-body cn-rise cn-rise-3 mt-6 max-w-[46ch] text-pretty">
              {AI_CONSULT.pageSub}
            </p>
          </div>

          <div className="cn-rise cn-rise-3 self-start">
            {CALENDLY_AI_URL ? (
              <>
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
                  {AI_CONSULT.bookTitle}
                </h2>
                <CalendlyEmbed url={CALENDLY_AI_URL} title={AI_CONSULT.bookTitle} />
              </>
            ) : (
              <div className="tile-elevated p-7 sm:p-10">
                <h2 className="cn-display cn-h3">
                  {AI_CONSULT.bookTitle}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-body">{AI_CONSULT.bookBody}</p>
                <Link href={INQUIRE_PATH} className="btn-primary mt-7 w-full sm:w-auto">
                  {INQUIRE_CTA}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-label="What I cover" className="cn-wrap py-16 sm:py-24">
        <div className="border-t border-line pt-12">
          <p className="cn-kicker">What I cover</p>
          <h2 className="cn-display cn-h3 mt-4 max-w-[22ch] text-balance">
            Developers, admins, and everyone exploring AI.
          </h2>
          <EvenGrid surface="ai-consult-topics" maxCols={3} className="mt-10">
            {AI_CONSULT_TOPICS.map((t) => (
              <div key={t.title} className="tile self-start p-7">
                <h3 className="text-base font-semibold tracking-tight text-ink">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{t.desc}</p>
              </div>
            ))}
          </EvenGrid>
        </div>
      </section>

      <section aria-labelledby="ai-for" className="cn-wrap py-16 sm:py-24">
        <div className="grid gap-10 border-t border-line pt-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <p className="cn-kicker">Who it is for</p>
            <h2 id="ai-for" className="cn-display cn-h3 mt-4 max-w-[18ch] text-balance">
              {AI_CONSULT_FOR.title}
            </h2>
          </div>
          <p className="cn-body max-w-[52ch] text-pretty">{AI_CONSULT_FOR.body}</p>
        </div>
      </section>

      <section aria-labelledby="ai-session" className="cn-wrap py-16 sm:py-24">
        <div className="border-t border-line pt-12">
          <p className="cn-kicker">What a session covers</p>
          <h2 id="ai-session" className="cn-display cn-h3 mt-4 max-w-[22ch] text-balance">
            Shaped around your work.
          </h2>
          <ol className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
            {AI_CONSULT_SESSION.map((s, i) => (
              <li key={s.title} className="cn-card">
                <p className="cn-kicker">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-3 text-base font-semibold tracking-tight text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="ai-leave" className="cn-wrap py-16 sm:py-24">
        <div className="grid gap-10 border-t border-line pt-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="cn-kicker">What you leave with</p>
            <ul className="mt-6 grid gap-5">
              {AI_CONSULT_LEAVE.map((x) => (
                <li key={x} className="cn-card cn-body text-pretty">
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="cn-kicker">Why me</p>
            <h2 id="ai-leave" className="cn-display cn-h3 mt-4 max-w-[18ch] text-balance">
              {AI_CONSULT_PROOF.title}
            </h2>
            <p className="cn-body mt-6 max-w-[48ch] text-pretty">{AI_CONSULT_PROOF.body}</p>
            <p className="mt-6 text-[15px]">
              <Link href="/portfolio" className="link-accent">
                See the portfolio
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="ai-start" className="cn-wrap py-16 sm:py-24">
        <div className="grid gap-10 border-t border-line pt-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <p className="cn-kicker">How it starts</p>
            <h2 id="ai-start" className="cn-display cn-h3 mt-4">
              One message.
            </h2>
          </div>
          <p className="cn-body max-w-[52ch] text-pretty">{AI_CONSULT_START}</p>
        </div>
      </section>

      <Questions items={QUESTIONS} id="ai-questions" />
      <OtherPages here="/ai-tooling" />

      <Close
        title={AI_CONSULT.inAppTitle}
        body={AI_CONSULT.inAppBody}
        secondary={{ href: '/portfolio', label: 'See the portfolio' }}
      />
    </div>
  )
}
