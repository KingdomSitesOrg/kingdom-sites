import Link from 'next/link'
import type { Metadata } from 'next'
import CinematicChrome from '@/components/cinematic/Chrome'
import { Browser, Phone } from '@/components/cinematic/Frames'
import Scroll from '@/components/cinematic/Scroll'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { OFFER, PROJECTS, SHOTS, type Shot } from '@/lib/work'

const DESCRIPTION =
  'Websites and iPhone and Android apps for churches, schools and small businesses, designed, built and looked after by Kingdom Sites.'

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

/* The Farzana Classroom story, one chapter per screen. JAM Classes is not open
   yet: its screens have the class details blurred, and say so. On a phone the
   story is told in three screens; `deskOnly` chapters show on wider screens. */
const CHAPTERS: { shot: Shot; url?: string; kicker: string; title: string; body: string; soon?: boolean; deskOnly?: boolean }[] = [
  {
    shot: SHOTS.farzanaSite,
    url: 'farzana.app',
    kicker: 'Farzana Classroom',
    title: 'A platform for schools.',
    body: 'Education software for schools, training organizations and education businesses. One proven platform, with each school’s own features built on top.',
  },
  {
    shot: SHOTS.jamClasses,
    kicker: 'JAM Classes',
    title: 'A school, built on it.',
    body: 'An online school for a homeschool Latin programme, built on Farzana Classroom: classes, families and payments in one place.',
    soon: true,
  },
  {
    shot: SHOTS.jamClass,
    kicker: 'JAM Classes',
    title: 'A page for every class.',
    body: 'Families see what each class is and who it is for, try a sample, and sign up.',
    soon: true,
    deskOnly: true,
  },
  {
    shot: SHOTS.jamAdminHome,
    kicker: 'For the teacher',
    title: 'The teacher’s desk.',
    body: 'Students, who was active this week, the month’s sales and every class, on one screen.',
    soon: true,
  },
  {
    shot: SHOTS.farzanaStudents,
    kicker: 'For the office',
    title: 'Every student, findable.',
    body: 'Search by name. Filter by class, by progress, by when they joined.',
    deskOnly: true,
  },
]

const MORE = ['tap-to-tick', 'ruta', 'delta', 'kcupg'].map((s) => PROJECTS.find((p) => p.slug === s)!)

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
              Kingdom Sites designs and builds websites and apps for churches, schools and small businesses, then looks
              after them once they are live. Every screen on this page is a real one.
            </p>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href={INQUIRE_PATH} className="cn-btn">
                {INQUIRE_CTA} <span aria-hidden="true">→</span>
              </Link>
              <a href="#farzana" className="cn-ghost">
                Watch the work <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </div>
        <Scroll prop="--q" className="cn-wrap cn-stage relative mt-14 pb-32 sm:mt-20 sm:pb-48">
          <div className="cn-tilt mx-auto max-w-[1180px]">
            <Browser shot={SHOTS.jamAdminHome} tag="Coming soon" priority />
          </div>
          <div className="cn-tilt-phone absolute bottom-0 right-[6%] w-[30%] max-w-[250px] sm:right-[8%] sm:w-[19%]">
            <Phone shot={SHOTS.jamClassPhone} priority />
          </div>
        </Scroll>
      </Scroll>

      {/* The Farzana story: the stage holds still, the screens change by chapter. */}
      <div id="farzana" className="scroll-mt-16" />
      <Scroll mode="sticky" steps={CHAPTERS.length} className="cn-scene" aria-label="Farzana Classroom and JAM Classes">
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
                          {c.soon ? <span className="cn-soon">Coming soon</span> : null}
                        </p>
                        <h2 className="cn-display cn-h3 mt-4">{c.title}</h2>
                        <p className="cn-body mt-5 max-w-[36ch]">{c.body}</p>
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
                      <Browser shot={c.shot} url={c.url} tag={c.soon ? 'Coming soon' : undefined} />
                    </div>
                  ))}
                </div>

                {/* On a phone: the same chapters, one after another. */}
                <div className="cn-stack">
                  {CHAPTERS.filter((c) => !c.deskOnly).map((c, i) => (
                    <div key={c.title}>
                      <Browser shot={c.shot} url={c.url} tag={c.soon ? 'Coming soon' : undefined} />
                      <p className="cn-kicker mt-6">
                        {String(i + 1).padStart(2, '0')} · {c.kicker}
                        {c.soon ? <span className="cn-soon">Coming soon</span> : null}
                      </p>
                      <h2 className="cn-display cn-h3 mt-3">{c.title}</h2>
                      <p className="cn-body mt-3">{c.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Scroll>

      <div className="cn-wrap mt-10 flex justify-center lg:mt-0">
        <Link href="/work/farzana" className="cn-ghost">
          The whole Farzana Classroom story <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Jam with Latin: phones at different depths. */}
      <section aria-labelledby="latin" className="mt-32 sm:mt-44">
        <div className="cn-wrap grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 id="latin" className="cn-display cn-h2">
            In students’ pockets.
          </h2>
          <p className="cn-body max-w-[44ch]">
            Jam with Latin is a Latin game for iPhone and Android. Students travel the Roman world city by city, answer case
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
      </section>

      {/* What we make: each line comes on as it reaches the middle of the screen. */}
      <section aria-labelledby="make" className="cn-wrap mt-24 sm:mt-36">
        <p id="make" className="cn-kicker">What we make</p>
        <div className="mt-8 space-y-10 sm:space-y-14">
          {OFFER.map((o) => (
            <Scroll key={o.title}>
              <div className="cn-lit grid gap-4 border-t border-[var(--line)] pt-6 lg:grid-cols-[1.4fr_1fr] lg:items-baseline">
                <h3 className="cn-display cn-h2">{o.title}</h3>
                <p className="cn-body">{o.body}</p>
              </div>
            </Scroll>
          ))}
        </div>
      </section>

      {/* More work. */}
      <section aria-labelledby="more" className="cn-wrap mt-32 sm:mt-44">
        <h2 id="more" className="cn-kicker">More work</h2>
        <div className="mt-8 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {MORE.map((p) => (
            <Scroll key={p.slug}>
              <a href={p.href} className="cn-reveal cn-card group block">
                <p className="cn-dim text-sm">{p.forWhom}</p>
                <h3 className="cn-display cn-h3 mt-2 transition-transform duration-300 group-hover:translate-x-1">
                  {p.name} <span aria-hidden="true" className="cn-dim">↗</span>
                </h3>
                <p className="cn-body mt-3 text-[1.02rem]">{p.line}</p>
              </a>
            </Scroll>
          ))}
        </div>
      </section>

      {/* Close. */}
      <section aria-label="Start a conversation" className="cn-wrap pb-28 pt-36 text-center sm:pb-40 sm:pt-52">
        <h2 className="cn-display cn-h1 mx-auto max-w-[12ch]">Yours could be next.</h2>
        <p className="cn-body mx-auto mt-6 max-w-[40ch]">
          Tell us what you have in mind. You talk to the person who builds it, and you get a plan and a quote once we
          understand it.
        </p>
        <Link href={INQUIRE_PATH} className="cn-btn mt-10">
          {INQUIRE_CTA} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </CinematicChrome>
  )
}
