import Link from 'next/link'
import type { Metadata } from 'next'
import { Close, HowItStarts, Needs, OtherPages, ProofCards, Questions, type Proof } from '@/components/cinematic/Audience'
import { getAllPosts } from '@/lib/blog'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { AREA_SERVED } from '@/lib/local'
import { jsonLd, serviceLd, shareCard, type Faq } from '@/lib/seo'
import { PROJECTS, SHOTS } from '@/lib/work'

/* The Rochester page (T-387). Google already shows the site for Rochester
   business searches ("small businesses rochester mn", "companies in rochester
   mn", "marketing rochester minnesota") 55 times with no clicks; this is the
   page those searches, and the six Rochester posts, lead to. */

const DESCRIPTION =
  'Websites, apps and online booking and payments for Rochester, MN businesses. Kingdom Sites is based in Rochester; you talk to Thomas Klein, who builds it.'

export const metadata: Metadata = {
  title: 'Websites and apps for Rochester, MN businesses',
  description: DESCRIPTION,
  alternates: { canonical: '/rochester-mn' },
  ...shareCard('Websites and apps for Rochester businesses — Kingdom Sites', DESCRIPTION, '/rochester-mn'),
}

const NEEDS = [
  {
    title: 'A website that brings in work.',
    body: 'It says what you do, where you work and how to reach you, reads well on a phone, and shows up when people in Rochester search for it. You can update it yourself.',
  },
  {
    title: 'Booking and payments online.',
    body: 'Customers book and pay at any hour, without you at a desk.',
  },
  {
    title: 'The app your customers ask for.',
    body: 'Designed, built and published on the App Store and Google Play under your name, and kept working as phones update.',
  },
  {
    title: 'AI that saves you time.',
    body: 'I help you use AI to bring in more revenue, save time and grow your business.',
  },
]

const project = (slug: string) => PROJECTS.find((p) => p.slug === slug)!
const card = (slug: string, label: string): Proof => {
  const p = project(slug)
  return { href: p.href!, name: p.name, label, line: p.line, card: p.card! }
}

const PROOF: Proof[] = [
  {
    href: '/portfolio/farzana-classroom',
    name: 'Farzana Classroom',
    label: 'Platform · Schools and education businesses',
    line: 'Classes, families and payments in one place, not three tools stitched together.',
    card: SHOTS.farzanaClasses,
  },
  card('tap-to-tick', 'App · iPhone'),
  card('kcupg', 'Website · Kansas City'),
  card('delta', 'Website · Bangladesh'),
]

const QUESTIONS: Faq[] = [
  {
    q: 'Who will I be working with?',
    a: 'Me, Thomas Klein. I design, build, ship and maintain everything myself, so you always know who you are talking to, from the first call to the fixes after launch.',
  },
  {
    q: 'What does a website or app cost?',
    a: 'As a rough guide, most websites are around $1,000 to $2,000, simpler apps around $3,000 to $5,000, and larger systems around $6,000 to $10,000 and up. You get an exact quote after we talk.',
  },
  {
    q: 'Can I update the website myself?',
    a: 'Yes. Every website I build is one you can update yourself, and I look after anything more than that.',
  },
  {
    q: 'Do you only work with Rochester businesses?',
    a: 'No. Kingdom Sites is based in Rochester, Minnesota, and I also build for clients elsewhere, from a community dashboard in Kansas City to a website for a project in Bangladesh.',
  },
]

export default function Rochester() {
  const posts = getAllPosts()
  return (
    <div className="w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            serviceLd({
              name: 'Websites and apps for Rochester businesses',
              description: DESCRIPTION,
              path: '/rochester-mn',
              audience: 'Businesses in Rochester, MN and Southeast Minnesota',
              areaServed: AREA_SERVED,
            }),
          ),
        }}
      />

      <section className="cn-wrap pb-10 pt-16 sm:pt-24">
        <p className="cn-kicker cn-rise">Rochester, Minnesota</p>
        <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 max-w-[14ch] text-balance">
          Websites and apps for Rochester businesses.
        </h1>
        <p className="cn-body cn-rise cn-rise-3 mt-8 max-w-[52ch] text-pretty">
          Kingdom Sites is based in Rochester. I build websites, iPhone and Android apps and the software behind them for
          businesses, churches and anyone in Rochester and Southeast Minnesota who needs software.
        </p>
        <div className="cn-rise cn-rise-3 mt-10 flex flex-wrap gap-3">
          <Link href={INQUIRE_PATH} className="cn-btn">
            {INQUIRE_CTA} <span aria-hidden="true">→</span>
          </Link>
          <a href="#proof" className="cn-ghost">
            See what I have built <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section aria-labelledby="needs" className="cn-wrap mt-24 sm:mt-36">
        <p className="cn-kicker">What I build</p>
        <h2 id="needs" className="cn-display cn-h2 mt-5 max-w-[16ch]">
          What a Rochester business usually needs.
        </h2>
        <Needs items={NEEDS} />
      </section>

      <section aria-labelledby="found" className="cn-wrap mt-28 sm:mt-40">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <p className="cn-kicker">Getting found in Rochester</p>
            <h2 id="found" className="cn-display cn-h2 mt-5">
              Most customers start with a search.
            </h2>
            <p className="cn-body mt-8 max-w-[46ch] text-pretty">
              Someone needs a lawn crew, a coffee near Mayo Clinic or a bike tune-up, and they open Google or Maps on their
              phone. A website is one part of being found there; your Google Business Profile, your reviews and the words
              people actually type matter just as much. These posts are plain advice on all of it.
            </p>
          </div>
          <div>
            <p className="cn-kicker">From the blog</p>
            <ul className="mt-5 grid gap-5">
              {posts.map((p) => (
                <li key={p.slug} className="cn-card">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-[17px] font-medium leading-snug text-[var(--fg)] underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="proof" aria-labelledby="proof-h" className="cn-wrap mt-28 scroll-mt-20 sm:mt-40">
        <p className="cn-kicker">Proof</p>
        <h2 id="proof-h" className="cn-display cn-h2 mt-5">
          Software I have built.
        </h2>
        <ProofCards items={PROOF} />
      </section>

      <HowItStarts />
      <Questions items={QUESTIONS} />
      <OtherPages here="/rochester-mn" />

      <Close
        title="Your business could be next."
        body="Tell me what you have in mind: a website, an app, or help putting AI to work. You get a plan and a quote once I understand it."
      />
    </div>
  )
}
