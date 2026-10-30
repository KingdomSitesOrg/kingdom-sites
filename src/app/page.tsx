import Link from 'next/link'
import type { Metadata } from 'next'
import CinematicChrome from '@/components/cinematic/Chrome'
import { Browser, Phone } from '@/components/cinematic/Frames'
import { Credit } from '@/components/cinematic/Maker'
import Scroll from '@/components/cinematic/Scroll'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { OFFER, PAYS, PROJECTS, SHOTS, type Shot } from '@/lib/work'

const DESCRIPTION =
  'Websites, iPhone and Android apps and AI consultation for businesses, churches and anyone who needs software, designed, built and looked after by Kingdom Sites.'

export const metadata: Metadata = {
  title: 'Kingdom Sites — Made to be used. Made to be yours.',
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Kingdom Sites — Made to be used. Made to be yours.',
    description: DESCRIPTION,
    url: 'https://kingdom-sites.com',
    siteName: 'Kingdom Sites',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Kingdom Sites — Made to be used. Made to be yours.', description: DESCRIPTION },
}

/* The Farzana Classroom story, one chapter per screen. The school screens show
   Wren Hall, a made-up demo school, and say so in the window's note. The home
   page shows Farzana in three places at most (Thomas, T-372): the hero's window
   and phone, and these two chapters. */
const PRODUCT = 'Farzana Classroom'
const DEMO = 'Demo school'
const CHAPTERS: { shot: Shot; note?: string; kicker: string; title: string; body: string; gives: string }[] = [
  {
    shot: SHOTS.farzanaHome,
    note: DEMO,
    kicker: 'Farzana Classroom',
    title: 'A platform for schools.',
    body: 'Education software for schools, training organizations and education businesses. One proven platform, with each school’s own features built on top.',
    gives: 'One system for classes, families and payments, instead of a website, a sign-up form and a payments app stitched together.',
  },
  {
    shot: SHOTS.farzanaClasses,
    note: DEMO,
    kicker: 'A school on it',
    title: 'A school, built on it.',
    body: 'Each school gets its own site, name and crest, with its classes, families and payments in one place. Shown here with a demo school.',
    gives: 'Families find a class, sign up and pay online at any hour, with no one at a desk to take it.',
  },
]

/* Ruta last, so the KCUPG chapter comes right after it (Thomas, T-372). */
const MORE = ['tap-to-tick', 'delta', 'ruta'].map((s) => PROJECTS.find((p) => p.slug === s)!)

/* Who made what, said on each card. Ruta is a team's product; I work on it. */
const ROLE: Record<string, string> = {
  'tap-to-tick': 'Designed and built by me',
  ruta: 'Contract work, on the team',
  delta: 'Designed and built by me',
}

export default function Home() {
  return (
    <CinematicChrome>
      {/* Hero: the words, then a real screen lying back that stands up as you scroll. */}
      <Scroll mode="sticky" className="cn-hero" aria-label="Kingdom Sites">
        <div className="cn-wrap pt-16 sm:pt-24">
          <p className="cn-kicker">Websites · iPhone and Android apps · Looked after once live</p>
          <h1 className="cn-display cn-h1 mt-5">
            <span className="block">Made to be used.</span>
            <span className="block">Made to be yours.</span>
          </h1>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <p className="cn-body max-w-[46ch]">
              Kingdom Sites designs and builds websites and apps for businesses, churches and anyone who needs
              software, then looks after them once they are live. Every screen on this page is from software I built.
            </p>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href={INQUIRE_PATH} className="cn-btn">
                {INQUIRE_CTA} <span aria-hidden="true">→</span>
              </Link>
              <a href="#farzana" className="cn-ghost">
                See the portfolio <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </div>
        <Scroll prop="--q" className="cn-wrap cn-stage relative mt-14 pb-32 sm:mt-20 sm:pb-48">
          <div className="cn-tilt mx-auto max-w-[1180px]">
            <Browser shot={SHOTS.farzanaDesk} product={PRODUCT} note={DEMO} priority />
          </div>
          <div className="cn-tilt-phone absolute bottom-0 right-[6%] w-[30%] max-w-[250px] sm:right-[8%] sm:w-[19%]">
            <Phone shot={SHOTS.farzanaClassPhone} eager sizes="(min-width: 1320px) 250px, (min-width: 640px) 19vw, 30vw" />
          </div>
        </Scroll>
      </Scroll>

      {/* Right after the first window and phone: I built this. Said once. */}
      <Credit id="farzana" title="I built this." />

      {/* The Farzana story: the stage holds still, the screens change by chapter. */}
      <div id="farzana" className="scroll-mt-16" />
      <Scroll mode="sticky" steps={CHAPTERS.length} className="cn-scene" aria-label="Farzana Classroom">
        <div style={{ height: `${CHAPTERS.length * 85}svh` }} className="cn-scene-h">
          <div className="cn-pin">
            <div className="cn-wrap w-full">
              <div className="cn-scene-grid">
                <div>
                  <div className="cn-chapters">
                    {CHAPTERS.map((c, i) => (
                      <div key={c.title} className={`cn-chapter cn-c${i}`}>
                        <p className="cn-kicker">
                          {String(i + 1).padStart(2, '0')} · {c.kicker}
                        </p>
                        <h2 className="cn-display cn-h3 mt-4">{c.title}</h2>
                        <p className="cn-body mt-5 max-w-[36ch]">{c.body}</p>
                        <p className="cn-gives">
                          <span className="cn-for">For them</span>
                          {c.gives}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="cn-rail" aria-hidden="true">
                    {CHAPTERS.map((c, i) => (
                      <span key={c.title} className={`cn-r${i}`} />
                    ))}
                  </div>
                </div>
                <div className="cn-screens">
                  {CHAPTERS.map((c, i) => (
                    <div key={c.title} className={`cn-screen cn-c${i}`}>
                      <Browser shot={c.shot} product={PRODUCT} note={c.note} />
                    </div>
                  ))}
                </div>

                {/* On a phone: the same chapters, one after another. */}
                <div className="cn-stack">
                  {CHAPTERS.map((c, i) => (
                    <div key={c.title}>
                      <Browser shot={c.shot} product={PRODUCT} note={c.note} />
                      <p className="cn-kicker mt-6">
                        {String(i + 1).padStart(2, '0')} · {c.kicker}
                      </p>
                      <h2 className="cn-display cn-h3 mt-3">{c.title}</h2>
                      <p className="cn-body mt-3">{c.body}</p>
                      <p className="cn-gives">
                        <span className="cn-for">For them</span>
                        {c.gives}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Scroll>

      <div className="cn-wrap mt-10 flex justify-center lg:mt-0">
        <Link href="/portfolio#farzana" className="cn-ghost">
          The whole Farzana Classroom story <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* The Latin learning game: phones at different depths. */}
      <section aria-labelledby="latin" className="mt-32 sm:mt-44">
        <div className="cn-wrap grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 id="latin" className="cn-display cn-h2">
            In students’ pockets.
          </h2>
          <p className="cn-body max-w-[44ch]">
            A Latin learning game for iPhone and Android. Students travel the Roman world city by city, answer case
            challenges and race each other on the leaderboard.{' '}
            <Link href="/latin-game" className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
              See the game
            </Link>
          </p>
        </div>
        <Scroll className="cn-wrap mt-16 pb-24 sm:mt-24">
          <div className="cn-depth mx-auto max-w-[1180px]">
            {[SHOTS.latinHome, SHOTS.latinMap, SHOTS.latinCase, SHOTS.latinBoard].map((s) => (
              <Phone key={s.src} shot={s} />
            ))}
          </div>
        </Scroll>
        <Credit id="latin" />
      </section>

      {/* What I make: each line comes on as it reaches the middle of the screen. */}
      <section aria-labelledby="make" className="cn-wrap mt-24 sm:mt-36">
        <p id="make" className="cn-kicker">What I make</p>
        <div className="mt-8 space-y-10 sm:space-y-14">
          {OFFER.map((o) => (
            <Scroll key={o.title}>
              <div className="cn-lit grid gap-4 border-t border-[var(--line)] pt-6 lg:grid-cols-[1.4fr_1fr] lg:items-baseline">
                <h3 className="cn-display cn-h2">{o.title}</h3>
                <p className="cn-body">
                  {o.body}
                  {o.href ? (
                    <>
                      {' '}
                      <Link href={o.href} className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
                        About AI consultation
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
            </Scroll>
          ))}
        </div>
      </section>

      {/* More work. */}
      <section aria-labelledby="more" className="cn-wrap mt-32 sm:mt-44">
        <h2 id="more" className="cn-kicker">More work</h2>
        <div className="mt-8 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {MORE.map((p) => (
            <Scroll key={p.slug}>
              <a href={p.href} className="cn-reveal cn-card group block">
                <p className="cn-dim text-sm">
                  {p.forWhom} · {ROLE[p.slug]}
                </p>
                <h3 className="cn-display cn-h3 mt-2 transition-transform duration-300 group-hover:translate-x-1">
                  {p.name} <span aria-hidden="true" className="cn-dim">↗</span>
                </h3>
                <p className="cn-body mt-3 text-[1.02rem]">{p.line}</p>
              </a>
            </Scroll>
          ))}
        </div>
      </section>

      {/* KCUPG: one window, then what I made and what it does for them. */}
      <section aria-labelledby="kcupg" className="mt-32 sm:mt-44">
        <div className="cn-wrap grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <p className="cn-kicker">KCUPG · Local ministry in Kansas City</p>
            <h2 id="kcupg" className="cn-display cn-h2 mt-5">
              A city’s communities, at a glance.
            </h2>
          </div>
          <p className="cn-body max-w-[44ch]">
            For local ministry in Kansas City, I built a dashboard of the city’s communities from North Africa to East
            Asia: people, languages and faiths, and the places to meet them, on one map.{' '}
            <a href="https://kcupgs.com" target="_blank" rel="noopener" className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
              Open KCUPG
            </a>
          </p>
        </div>
        <Scroll className="cn-wrap mt-14 pb-16 sm:mt-20 sm:pb-24">
          <div className="cn-reveal mx-auto max-w-[1180px]">
            <Browser shot={SHOTS.kcupgDashboard} product="KCUPG" />
          </div>
        </Scroll>
        <Credit id="kcupg" />
      </section>

      {/* Why it pays: the business case, in plain words. */}
      <section aria-labelledby="pays" className="cn-wrap mt-32 sm:mt-44">
        <p className="cn-kicker">Why it is worth it</p>
        <h2 id="pays" className="cn-display cn-h2 mt-5">
          It should pay its way.
        </h2>
        <div className="cn-pays">
          {PAYS.map((x) => (
            <Scroll key={x.title}>
              <div className="cn-reveal">
                <h3 className="cn-display cn-h3">{x.title}</h3>
                <p className="cn-body mt-4 max-w-[40ch]">{x.body}</p>
              </div>
            </Scroll>
          ))}
        </div>
      </section>

      {/* Close. */}
      <section aria-label="Start a conversation" className="cn-wrap pb-28 pt-36 text-center sm:pb-40 sm:pt-52">
        <h2 className="cn-display cn-h1 mx-auto max-w-[12ch]">Yours could be next.</h2>
        <p className="cn-body mx-auto mt-6 max-w-[40ch]">
          A website, an app, or help putting AI to work: tell me what you have in mind. You talk to me, the person who
          builds it, and you get a plan and a quote once I understand it.
        </p>
        <Link href={INQUIRE_PATH} className="cn-btn mt-10">
          {INQUIRE_CTA} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </CinematicChrome>
  )
}
