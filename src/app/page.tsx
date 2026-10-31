import Link from 'next/link'
import type { Metadata } from 'next'
import CinematicChrome from '@/components/cinematic/Chrome'
import CaseTitle from '@/components/cinematic/CaseTitle'
import { Browser, Phone } from '@/components/cinematic/Frames'
import { Credit } from '@/components/cinematic/Maker'
import LatinPartner from '@/components/cinematic/LatinPartner'
import LitLink from '@/components/cinematic/LitLink'
import Scroll from '@/components/cinematic/Scroll'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { SHARE_URL, SITE_DESCRIPTION as DESCRIPTION, SITE_OG_IMAGE, SITE_TITLE } from '@/lib/seo'
import { OFFER, PAYS, PROJECTS, SHOTS, type Shot } from '@/lib/work'

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE_TITLE,
    description: DESCRIPTION,
    url: SHARE_URL,
    siteName: 'Kingdom Sites',
    locale: 'en_US',
    type: 'website',
    images: [{ ...SITE_OG_IMAGE, url: `${SHARE_URL}${SITE_OG_IMAGE.url}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: DESCRIPTION,
    images: [`${SHARE_URL}${SITE_OG_IMAGE.url}`],
  },
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
    body: 'Education software for schools, training organizations, education businesses or anyone who teaches classes, customized to your needs.',
    gives: 'Classes, families and payments in one place, not three tools stitched together.',
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
          <h1 className="cn-display cn-h1">
            <span className="block">Made to be used.</span>
            <span className="block">Made to be yours.</span>
          </h1>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <p className="cn-body max-w-[46ch]">
              I build websites and apps for businesses, churches and anyone who needs software. These screens are
              all from my own work.
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

      {/* Right after the first window and phone: What I built. Said once. */}
      <Credit id="farzana" title="What I built" />

      {/* The Farzana story: the stage holds still, the screens change by chapter. */}
      <div id="farzana" className="scroll-mt-16" />
      {/* One chapter is a still screen: it is not pinned, so there is no scroll to walk through (T-381 left one). */}
      <Scroll mode="sticky" steps={CHAPTERS.length} className={`cn-scene${CHAPTERS.length > 1 ? '' : ' cn-scene-still'}`} aria-label="Farzana Classroom">
        <div style={CHAPTERS.length > 1 ? { height: `${CHAPTERS.length * 85}svh` } : undefined} className="cn-scene-h">
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
                  {CHAPTERS.length > 1 ? (
                    <div className="cn-rail" aria-hidden="true">
                      {CHAPTERS.map((c, i) => (
                        <span key={c.title} className={`cn-r${i}`} />
                      ))}
                    </div>
                  ) : null}
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
        <LitLink href="/portfolio/farzana-classroom" label="The whole Farzana Classroom story" />
      </div>

      {/* JAM Legio, the Latin learning game: phones at different depths. */}
      <section aria-labelledby="latin" className="mt-32 sm:mt-44">
        <div className="cn-wrap grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 id="latin" className="cn-display cn-h2">
            In students’ pockets.
          </h2>
          <p className="cn-body max-w-[44ch]">
            JAM Legio, a Latin learning game for iPhone and Android. Students travel the Roman world city by city, answer case
            challenges and race each other on the leaderboard.{' '}
            <Link href="/latin-game" className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
              See JAM Legio
            </Link>
          </p>
        </div>
        <Scroll className="cn-wrap mt-16 pb-6 sm:mt-24">
          <div className="cn-depth mx-auto max-w-[1180px]">
            {[SHOTS.latinHome, SHOTS.latinMap, SHOTS.latinCase, SHOTS.latinBoard].map((s) => (
              <Phone key={s.src} shot={s} />
            ))}
          </div>
        </Scroll>
        <div className="cn-wrap">
          <LatinPartner />
        </div>
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
        <h2 id="more" className="cn-kicker">More from my portfolio</h2>
        <div className="mt-8 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {MORE.map((p) => {
            const external = p.href!.startsWith('http')
            return (
              <Scroll key={p.slug} className="flex">
                <a
                  href={p.href}
                  className="cn-reveal cn-card group block"
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <p className="cn-dim text-sm">
                    {p.forWhom} · {ROLE[p.slug]}
                  </p>
                  <h3 className="cn-display cn-h3 cn-case-name mt-2">
                    <CaseTitle name={p.name} />
                  </h3>
                  <p className="cn-body cn-case-line mt-3 text-[1.02rem]">{p.line}</p>
                </a>
              </Scroll>
            )
          })}
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
            <Link href="/portfolio/kcupg" className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
              The KCUPG story
            </Link>
            {' · '}
            <a href="https://kcupgs.com" target="_blank" rel="noopener" className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
              Open KCUPG
            </a>
          </p>
        </div>
        <Scroll className="cn-wrap mt-14 sm:mt-20">
          <div className="cn-reveal mx-auto max-w-[1180px]">
            <Browser shot={SHOTS.kcupgDashboard} product="KCUPG" />
          </div>
        </Scroll>
      </section>

      {/* Why it matters: the business case, in plain words. */}
      <section aria-labelledby="pays" className="cn-wrap mt-32 sm:mt-44">
        <p className="cn-kicker">Why it matters</p>
        <h2 id="pays" className="cn-display cn-h2 mt-5">
          In 2026, software is the backbone of nearly every business.
        </h2>
        <p className="cn-display cn-h3 mt-6">Don&rsquo;t fall behind. Better software = more revenue.</p>
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
          A website, an app, or help putting AI to work: tell me what you have in mind. You talk to me, Thomas, the person who
          will build it, and you get a plan and a quote once I understand it.
        </p>
        <Link href={INQUIRE_PATH} className="cn-btn mt-10">
          {INQUIRE_CTA} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </CinematicChrome>
  )
}
