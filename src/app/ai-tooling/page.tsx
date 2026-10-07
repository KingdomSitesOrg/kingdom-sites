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
      <section className="hero-wash px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="self-start">
            <p className="eyebrow">AI consultation</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
              {AI_CONSULT.pageTitle}
            </h1>
            <p className="mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
              {AI_CONSULT.pageSub}
            </p>
          </div>

          <div className="self-start">
            {CALENDLY_AI_URL ? (
              <>
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
                  {AI_CONSULT.bookTitle}
                </h2>
                <CalendlyEmbed url={CALENDLY_AI_URL} title={AI_CONSULT.bookTitle} />
              </>
            ) : (
              <div className="tile-elevated p-7 sm:p-10">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
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

      <section aria-label="What we cover" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
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

      <section aria-label="AI in your app" className="border-t border-line px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {AI_CONSULT.inAppTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-body">
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
