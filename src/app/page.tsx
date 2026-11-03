import Link from 'next/link'
import type { Metadata } from 'next'
import CinematicChrome from '@/components/cinematic/Chrome'
import CaseTitle from '@/components/cinematic/CaseTitle'
import { Browser, Phone } from '@/components/cinematic/Frames'
import LatinPartner from '@/components/cinematic/LatinPartner'
import LaptopFilm from '@/components/cinematic/LaptopFilm'
import Scroll from '@/components/cinematic/Scroll'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { SHARE_URL, SITE_DESCRIPTION as DESCRIPTION, SITE_OG_IMAGE, SITE_TITLE } from '@/lib/seo'
import { SHOTS } from '@/lib/work'

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

/* Farzana's booking page (it lives at farzana.app/book; this address takes you there). */
const FARZANA_BOOK = '/farzana/book'

/* The same gap between every section after the film, so the page keeps one rhythm. */
const GAP = 'mt-32 sm:mt-44'

/* A quiet text link: underlined, no pill. */
const TEXT_LINK = 'text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current'

/* The rest of the work, one line each. KCUPG first, under its own window.
   Ruta is a team's product: the line says I work on it, not that I made it. */
const MORE: { name: string; line: string; href: string }[] = [
  { name: 'KCUPG', line: 'A map of Kansas City’s communities, for local ministry.', href: '/portfolio/kcupg' },
  { name: 'Tap to Tick', line: 'An iPhone expense app. Log a purchase in one tap.', href: '/tap-to-tick' },
  { name: 'Delta Development Project', line: 'A website for village schools and disaster relief in Bangladesh.', href: '/portfolio/delta' },
  { name: 'Ruta', line: 'Contract work on a live platform for landscaping businesses.', href: '/ruta' },
]

export default function Home() {
  return (
    <CinematicChrome>
      {/* The top: a plain strip, so it is clear at once what this site is. */}
      <section aria-label="Kingdom Sites" className="cn-wrap kf-strip">
        <h1 className="cn-display cn-h2">I build websites and apps.</h1>
        <div className="mt-8">
          <Link href={INQUIRE_PATH} className="cn-btn">
            {INQUIRE_CTA} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* The film: a laptop on a desk opens on Farzana Classroom, and the app
          on its screen is in use, on a loop, as the page scrolls on. */}
      <LaptopFilm />

      {/* The film is the Farzana story; this is its ask, and the one way to read more. */}
      <section aria-labelledby="real-demo" className="cn-wrap kf-ask">
        <p className="cn-body mx-auto max-w-[40ch]">Someone asked me for custom classroom software. This is what I built.</p>
        <h2 id="real-demo" className="cn-display cn-h2 mx-auto mt-6 max-w-[22ch]">
          Want software like this, or something else entirely?
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={FARZANA_BOOK} className="cn-btn">
            Book a Farzana demo <span aria-hidden="true">→</span>
          </Link>
          <Link href={INQUIRE_PATH} className="cn-ghost">
            {INQUIRE_CTA} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="mt-8 text-sm">
          <Link href="/portfolio/farzana-classroom" className={TEXT_LINK}>
            The whole Farzana Classroom story
          </Link>
        </p>
      </section>

      {/* JAM Legio, the Latin learning game: one line, its credit, then phones at different depths. */}
      <section aria-labelledby="latin" className="mt-14 sm:mt-12">
        <div className="cn-wrap grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 id="latin" className="cn-display cn-h2">
            In students’ pockets.
          </h2>
          <div>
            <p className="cn-body max-w-[44ch]">
              JAM Legio, a Latin learning game for iPhone and Android.{' '}
              <Link href="/latin-game" className={TEXT_LINK}>
                See JAM Legio
              </Link>
            </p>
            <LatinPartner className="cn-partner !mt-3" />
          </div>
        </div>
        <Scroll className="cn-wrap mt-16 pb-6 sm:mt-24">
          <div className="cn-depth mx-auto max-w-[1180px]">
            {[SHOTS.latinHome, SHOTS.latinMap, SHOTS.latinCase, SHOTS.latinBoard].map((s) => (
              <Phone key={s.src} shot={s} />
            ))}
          </div>
        </Scroll>
      </section>

      {/* The rest of the work: one window, then a name, a line and a link each. */}
      <section aria-labelledby="more" className={`cn-wrap ${GAP}`}>
        <h2 id="more" className="cn-display cn-h2">
          More of my work.
        </h2>
        <Scroll className="mt-12 sm:mt-16">
          <div className="cn-reveal mx-auto max-w-[1180px]">
            <Browser shot={SHOTS.kcupgDashboard} product="KCUPG" />
          </div>
        </Scroll>
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:mt-16 md:grid-cols-2">
          {MORE.map((p) => (
            <li key={p.name}>
              <Link href={p.href} className="group block">
                <h3 className="cn-display cn-h3">
                  <CaseTitle name={p.name} />
                </h3>
                <p className="cn-body mt-3 max-w-[44ch]">{p.line}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* An aside, after the real work: STRATA is a concept site, not a client. */}
      <aside aria-labelledby="strata" className="cn-wrap mt-24 sm:mt-32">
        <Link
          href="/strata"
          className="group grid grid-cols-[112px_1fr] items-center gap-4 sm:grid-cols-[minmax(0,280px)_1fr] sm:gap-8"
        >
          <span className="cn-shot cn-case-frame block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/work/strata-still.webp" alt="A 3D printed part on a turntable, from the STRATA concept site" width={1600} height={1000} loading="lazy" className="!object-[70%_50%]" />
          </span>
          <span className="block">
            <span className="cn-soon !ml-0">Concept site</span>
            <span id="strata" className="mt-3 block text-[0.98rem] leading-snug text-[var(--fg)] sm:text-[1.05rem]">
              STRATA, a made-up 3D printing company. A test of how far a website can go.
            </span>
            <span className="cn-dim mt-3 inline-flex items-center gap-2 text-sm group-hover:text-[var(--fg)]">
              Open the concept site <span aria-hidden="true">→</span>
            </span>
          </span>
        </Link>
      </aside>

      {/* Close. */}
      <section aria-label="Start a conversation" className="cn-wrap pb-28 pt-32 text-center sm:pb-40 sm:pt-44">
        <h2 className="cn-display cn-h2 mx-auto max-w-[22ch]">Yours could be next.</h2>
        <p className="cn-body mx-auto mt-6 max-w-[40ch]">A website, an app, or AI put to work: tell me what you have in mind.</p>
        <Link href={INQUIRE_PATH} className="cn-btn mt-10">
          {INQUIRE_CTA} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </CinematicChrome>
  )
}
