import type { Metadata } from 'next'
import Link from 'next/link'
import CalendlyEmbed from '@/components/CalendlyEmbed'
import EvenGrid from '@/components/EvenGrid'
import { CALENDLY_AI_URL, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { AI_CONSULT, AI_CONSULT_TOPICS } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'AI consultation',
  description:
    'Hands-on sessions on how to leverage AI yourself: loops, goals, connectors, skills, and .md files. For developers, admins, and anyone exploring AI past the chat box.',
  alternates: { canonical: '/ai-tooling' },
  openGraph: {
    title: 'AI consultation — Kingdom Sites',
    description:
      'Learn to use AI for real work — not just chat. Loops, goals, connectors, skills, and instruction files.',
    url: 'https://kingdom-sites.com/ai-tooling',
    siteName: 'Kingdom Sites',
    locale: 'en_US',
    type: 'website',
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

      <section aria-label="What we cover" className="cn-wrap py-16 sm:py-24">
        <div className="border-t border-line pt-12">
          <h2 className="cn-display cn-h3 max-w-[22ch] text-balance">
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

      <section aria-label="AI in your app" className="cn-wrap pb-28 pt-16 text-center sm:pb-36 sm:pt-24">
        <div>
          <h2 className="cn-display cn-h2 mx-auto max-w-[16ch] text-balance">
            {AI_CONSULT.inAppTitle}
          </h2>
          <p className="cn-body mx-auto mt-6 max-w-[42ch] text-pretty">
            {AI_CONSULT.inAppBody}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={INQUIRE_PATH} className="btn-primary">
              {INQUIRE_CTA}
            </Link>
            <Link href="/my-work" className="btn-ghost">
              See my work
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
