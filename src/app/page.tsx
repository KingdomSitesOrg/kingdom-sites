import Link from 'next/link'
import type { Metadata } from 'next'
import CinematicChrome from '@/components/cinematic/Chrome'
import BuildWords from '@/components/cinematic/BuildWords'
import { Browser, Phone } from '@/components/cinematic/Frames'
import LatinPartner from '@/components/cinematic/LatinPartner'
import LaptopFilm from '@/components/cinematic/LaptopFilm'
import Scroll from '@/components/cinematic/Scroll'
import StepAside from '@/components/cinematic/StepAside'
import InquiryForm from '@/components/InquiryForm'
import { INQUIRE_CTA } from '@/lib/contact'
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

/* A quiet text link: underlined, no pill. */
const TEXT_LINK = 'text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current'

/* Three of STRATA's own stills, its most colourful, cross-fading in the band. */
const STRATA_STILLS = [
  { src: '/strata/stills/fleet-1-desktop.webp', alt: 'Rows of 3D printers glowing in a dark hall, from the STRATA concept site' },
  { src: '/strata/stills/optimize-3-desktop.webp', alt: 'A 3D printed part mapped in orange and blue by the stress it carries' },
  { src: '/strata/stills/machines-0-desktop.webp', alt: 'A printer laying down a part in blue light' },
]

export default function Home() {
  return (
    <CinematicChrome>
      {/* The top: one line whose last word changes, and one button. */}
      <section aria-label="Kingdom Sites" className="cn-wrap kf-strip">
        <BuildWords />
        <div className="mt-8">
          <Link href="#talk" className="cn-btn">
            {INQUIRE_CTA} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* The film: the room lights up, a laptop on a desk opens on Farzana
          Classroom, and the app on its screen is in use, on a loop. */}
      <LaptopFilm />

      {/* What the film was: a request, and the app it became. */}
      <section aria-labelledby="story" className="cn-wrap kf-story">
        <h2 id="story" className="cn-display cn-h2 mx-auto max-w-[18ch]">
          Someone asked me to build them custom classroom software.
        </h2>
        <p className="cn-body mx-auto mt-6 max-w-[40ch]">Now it’s coming to life.</p>
        <div className="kf-shots-grid mx-auto max-w-[1180px] text-left">
          <Scroll>
            <div className="cn-reveal">
              <Browser shot={SHOTS.appClass} product="Farzana Classroom" />
            </div>
          </Scroll>
          <Scroll>
            <div className="cn-reveal">
              <Browser shot={SHOTS.appStudents} product="Farzana Classroom" />
            </div>
          </Scroll>
          <Scroll>
            <div className="cn-reveal lg:mt-24">
              <Browser shot={SHOTS.appAnalytics} product="Farzana Classroom" />
            </div>
          </Scroll>
        </div>
        <h3 className="cn-display cn-h3 mx-auto mt-24 max-w-[22ch] sm:mt-32">Want software like this, or something else entirely?</h3>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={FARZANA_BOOK} className="cn-btn">
            Book a Farzana demo <span aria-hidden="true">→</span>
          </Link>
          <Link href="#talk" className="cn-ghost">
            {INQUIRE_CTA} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Apps: JAM Legio, then Ruta, each a line and its phones. */}
      <section aria-labelledby="apps" className="mt-32 sm:mt-48">
        <div className="cn-wrap">
          <h2 id="apps" className="cn-display cn-h2">
            I also do multiple apps.
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
            <h3 className="cn-display cn-h3">JAM Legio</h3>
            <div>
              <p className="cn-body max-w-[44ch]">
                A Latin learning game for iPhone and Android.{' '}
                <Link href="/latin-game" className={TEXT_LINK}>
                  See JAM Legio
                </Link>
              </p>
              <LatinPartner className="cn-partner !mt-3" />
            </div>
          </div>
        </div>
        <Scroll className="cn-wrap mt-16 pb-6 sm:mt-24">
          <div className="cn-depth mx-auto max-w-[1180px]">
            {[SHOTS.latinHome, SHOTS.latinMap, SHOTS.latinCase, SHOTS.latinBoard].map((s) => (
              <Phone key={s.src} shot={s} />
            ))}
          </div>
        </Scroll>

        {/* Ruta is a team's product: the line says I build on it, not that I made it. */}
        <div className="cn-wrap mt-32 grid gap-6 sm:mt-44 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h3 className="cn-display cn-h3">Ruta</h3>
          <p className="cn-body max-w-[44ch]">
            The crew app for landscaping businesses. I build on Ruta’s team.{' '}
            <Link href="/ruta" className={TEXT_LINK}>
              See Ruta
            </Link>
          </p>
        </div>
        <Scroll className="cn-wrap mt-16 pb-6 sm:mt-24">
          <div className="cn-depth cn-depth-row mx-auto max-w-[1180px]">
            {[SHOTS.rutaQueue, SHOTS.rutaVisit, SHOTS.rutaTime].map((s) => (
              <Phone key={s.src} shot={s} />
            ))}
          </div>
        </Scroll>
      </section>

      {/* STRATA: a concept site, in its own colours, wide and centred. */}
      <section aria-labelledby="strata" className="kf-strata">
        <div className="cn-wrap">
          <span className="kf-strata-tag">Concept site</span>
          <h2 id="strata" className="cn-display kf-strata-name">
            STRATA
          </h2>
          <p className="cn-body mx-auto mt-6 max-w-[40ch]">A made-up 3D printing company. A test of how far a website can go.</p>
          <Link href="/strata" className="kf-strata-film block" aria-label="Open the STRATA concept site">
            {STRATA_STILLS.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.src} src={s.src} alt={s.alt} width={1600} height={1000} loading="lazy" decoding="async" />
            ))}
          </Link>
          <Link href="/strata" className="cn-btn mt-12">
            Open the concept site <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-10 text-sm">
            <Link href="/portfolio" className={TEXT_LINK}>
              See all my work
            </Link>
          </p>
        </div>
      </section>

      {/* Close: the note form, right here on the page. */}
      <StepAside id="talk" label="Start a conversation" className="cn-wrap scroll-mt-20 pb-28 pt-32 text-center sm:pb-40 sm:pt-44">
        <h2 className="cn-display cn-h2 mx-auto max-w-[22ch]">Yours could be next.</h2>
        <p className="cn-body mx-auto mt-6 max-w-[40ch]">A website, an app, or AI put to work: tell me what you have in mind.</p>
        <div className="kf-form mx-auto mt-12 max-w-[560px]">
          <InquiryForm />
        </div>
      </StepAside>
    </CinematicChrome>
  )
}
