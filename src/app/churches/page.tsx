import Link from 'next/link'
import type { Metadata } from 'next'
import { Close, HowItStarts, Needs, OtherPages, ProofCards, Questions, type Proof } from '@/components/cinematic/Audience'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { jsonLd, serviceLd, shareCard, type Faq } from '@/lib/seo'
import { PROJECTS } from '@/lib/work'

/* Churches and ministries (T-387): long-tail searches such as "church website
   designer" and "app for my church", with the ministry sites on this one as
   proof and the free websites from /mission. */

const DESCRIPTION =
  'Church websites, apps and ministry tools by Thomas Klein of Kingdom Sites. Ministries, missionaries raising support and churches get their website built for free.'

export const metadata: Metadata = {
  title: 'Websites and apps for churches and ministries',
  description: DESCRIPTION,
  alternates: { canonical: '/churches' },
  ...shareCard('Websites and apps for churches and ministries — Kingdom Sites', DESCRIPTION, '/churches'),
}

const NEEDS = [
  {
    title: 'A website people can find.',
    body: 'When you meet, where, what to expect on a first visit and how to get in touch, clear on a phone and easy for you to update.',
  },
  {
    title: 'Sign-ups and payments.',
    body: 'Events, classes and groups people can sign up for online, with payments where you need them.',
  },
  {
    title: 'Resources to share.',
    body: 'Videos, studies and guides people can watch, download and pass on, like the Prayer and Ministry sites below.',
  },
  {
    title: 'An app, when you need one.',
    body: 'Designed, built and published on the App Store and Google Play under your name, and kept working as phones update.',
  },
]

const card = (slug: string, label: string): Proof => {
  const p = PROJECTS.find((x) => x.slug === slug)!
  return { href: p.href!, name: p.name, label, line: p.line, card: p.card! }
}

const PROOF: Proof[] = [
  card('prayer', 'Website · Churches and small groups'),
  card('ministry', 'Website · Bible walkthroughs'),
  card('kcupg', 'Website · Local ministry in Kansas City'),
  card('delta', 'Website · A project of SIM Bangladesh'),
]

const QUESTIONS: Faq[] = [
  {
    q: 'Is the website really free for churches?',
    a: 'Yes. Ministries, missionaries raising support and churches get their website built for free. My time is the donation. The domain name, hosting and any outside service the site depends on stay in your name and under your control.',
  },
  {
    q: 'Can you build an app for our church or ministry?',
    a: 'Yes. I build iPhone and Android apps and publish them on the App Store and Google Play under your name. The free offer is for websites; an app gets a plan and a quote once I understand what it has to do.',
  },
  {
    q: 'Who looks after the site after launch?',
    a: 'I do. I build it and I maintain it, and you can update the words and pictures yourself.',
  },
  {
    q: 'Why do you do this?',
    a: 'I want to see Jesus glorified throughout the unreached world. Donated websites are one of the ways I put this business toward the gospel, and my client work fuels long-term mission work.',
  },
]

export default function Churches() {
  return (
    <div className="w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            serviceLd({
              name: 'Websites and apps for churches and ministries',
              description: DESCRIPTION,
              path: '/churches',
              audience: 'Churches, ministries and missionaries',
            }),
          ),
        }}
      />

      <section className="cn-wrap pb-10 pt-16 sm:pt-24">
        <p className="cn-kicker cn-rise">Churches and ministries</p>
        <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 max-w-[15ch] text-balance">
          Websites and apps for churches and ministries.
        </h1>
        <p className="cn-body cn-rise cn-rise-3 mt-8 max-w-[52ch] text-pretty">
          I build websites, apps and tools for churches, ministries and missionaries. My own ministry sites are part of
          this one, and ministries get their website built for free.
        </p>
        <div className="cn-rise cn-rise-3 mt-10 flex flex-wrap gap-3">
          <Link href={INQUIRE_PATH} className="cn-btn">
            {INQUIRE_CTA} <span aria-hidden="true">→</span>
          </Link>
          <a href="#free" className="cn-ghost">
            How the free websites work <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section id="free" aria-labelledby="free-h" className="cn-wrap mt-24 scroll-mt-20 sm:mt-36">
        <div className="grid gap-10 border-t border-[var(--line)] pt-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <p className="cn-kicker">Free websites for ministries</p>
            <h2 id="free-h" className="cn-display cn-h2 mt-5">
              I donate websites to ministries.
            </h2>
          </div>
          <div>
            <p className="cn-body text-pretty">
              Ministries, missionaries raising support, and churches get their website built for free
              <span className="align-super text-[0.6em]">*</span>, with the same care as every client. It is one of the
              ways I put this business toward the gospel.
            </p>
            <p className="mt-6 text-[14px] leading-relaxed text-[var(--dim)]">
              <span className="align-super text-[0.75em]">*</span> My time is the donation. The domain name and hosting
              stay in your name.
            </p>
            <p className="mt-6">
              <Link href="/mission#free-ministry-sites" className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
                My mission
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="needs" className="cn-wrap mt-28 sm:mt-40">
        <p className="cn-kicker">What I build</p>
        <h2 id="needs" className="cn-display cn-h2 mt-5 max-w-[16ch]">
          What a church usually needs.
        </h2>
        <Needs items={NEEDS} />
      </section>

      <section id="proof" aria-labelledby="proof-h" className="cn-wrap mt-28 scroll-mt-20 sm:mt-40">
        <p className="cn-kicker">Proof</p>
        <h2 id="proof-h" className="cn-display cn-h2 mt-5">
          Ministry work I have built.
        </h2>
        <ProofCards items={PROOF} />
      </section>

      <HowItStarts />
      <Questions items={QUESTIONS} />
      <OtherPages here="/churches" />

      <Close
        title="Your ministry could be next."
        body="Tell me about your church or ministry and what you need. You talk to me, Thomas, the person who will build it."
      />
    </div>
  )
}
