import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import CinematicChrome from '@/components/cinematic/Chrome'
import CaseTitle from '@/components/cinematic/CaseTitle'
import DotNav from '@/components/cinematic/DotNav'
import { APP_PHONE_SIZES, Browser, Phone } from '@/components/cinematic/Frames'
import LatinPartner from '@/components/cinematic/LatinPartner'
import Scroll from '@/components/cinematic/Scroll'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { LATIN_STORES, PROJECTS, SHOTS, type Project } from '@/lib/work'
import { shareCard } from '@/lib/seo'

const DESCRIPTION =
  'The portfolio of Kingdom Sites: Farzana Classroom, education software for schools; JAM Legio, a Latin learning game for iPhone and Android; contract work on Ruta; and the websites and tools around them.'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: DESCRIPTION,
  alternates: { canonical: '/portfolio' },
  ...shareCard('Portfolio — Kingdom Sites', DESCRIPTION, '/portfolio'),
}

const project = (slug: string) => PROJECTS.find((p) => p.slug === slug)!
const farzana = project('farzana')
const latin = project('latin-game')
const ruta = project('ruta')
const kcupg = project('kcupg')

/* STRATA is a concept site on this site, not a client: it sits with the rest,
   and its card says so. */
const STRATA: Project = {
  slug: 'strata',
  name: 'STRATA',
  kind: 'Concept site',
  forWhom: '3D printing',
  line: 'A printed part goes from idea to factory floor as you scroll.',
  platforms: 'Web',
  status: 'Concept',
  href: '/strata',
  card: { src: '/work/strata-still.webp', alt: 'A 3D printed part on a turntable, from the STRATA concept site', w: 1600, h: 1000 },
}
const CASES = [...['tap-to-tick', 'delta', 'prayer', 'ministry', 'sign'].map(project), STRATA]

const PRODUCT = 'Farzana Classroom'

/* What the KCUPG dashboard and map do, from its case study. */
const KCUPG_BUILT = [
  'A dashboard of the whole metro, every region side by side',
  'Six regions, from North Africa to East Asia, each with its own map',
  'Real places to meet people, filtered by country and kind of place',
  'Search by place, language or neighborhood, or ask the assistant',
  'People counts from the US Census Bureau, so nobody is counted twice',
]

const SECTIONS = [
  { id: 'farzana', label: 'Farzana Classroom' },
  { id: 'latin-game', label: 'JAM Legio' },
  { id: 'ruta', label: 'Ruta' },
  { id: 'kcupg', label: 'KCUPG' },
  { id: 'more', label: 'And the rest' },
]

/* The parts of Ruta I have worked on, as the Ruta page lists them. */
const RUTA_WORK = [
  'Billing and payments',
  'The crew app, including use without a signal',
  'Office tools for scheduling, messaging and review',
  'Customer self-service',
  'The backend behind the apps',
  'The AI assistant inside the product',
]

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[15px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="cn-dim">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function AppStoreIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.55.02-2.97.9-3.77 2.28-1.61 2.79-.41 6.92 1.15 9.19.76 1.11 1.67 2.35 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.24.87-1.28 1.23-2.53 1.25-2.59-.03-.01-2.4-.92-2.42-3.65zM14.9 5.4c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.68-1.09 1.77-.96 2.81 1.02.08 2.06-.52 2.69-1.28z" />
    </svg>
  )
}

function PlayStoreIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.6 2.3a1 1 0 0 0-.35.76v17.88a1 1 0 0 0 .35.76l9.24-9.7L3.6 2.3zm10.4 8.02 2.6-2.73-8.9-5.06a.98.98 0 0 0-.35-.12l6.65 7.91zm0 3.36-6.65 7.9c.12-.02.24-.06.35-.12l8.9-5.05-2.6-2.73zm1.13-1.68 3.02 3.17 2.6-1.48c.79-.45.79-1.93 0-2.38l-2.6-1.48-3.02 3.17z" />
    </svg>
  )
}

export default function Portfolio() {
  return (
    <CinematicChrome>
      <DotNav sections={SECTIONS} />

      <section aria-labelledby="work" className="cn-wrap pt-16 sm:pt-24">
        <h1 id="work" className="cn-display cn-h1">
          Portfolio
        </h1>
        <p className="cn-body mt-8 max-w-[46ch]">
          Multiple apps built, tested and proven. Education software, software for landscapers, websites, and
          everything in between.
        </p>
      </section>

      {/* Farzana Classroom: the Home screen lies back and stands up as you scroll, then two screens, side by side. */}
      <section id="farzana" tabIndex={-1} aria-labelledby="farzana-h" className="mt-24 scroll-mt-16 sm:mt-32">
        <Scroll mode="sticky" className="cn-hero">
          <div className="cn-wrap">
            <p className="cn-kicker">01 · Platform</p>
            <h2 id="farzana-h" className="cn-display cn-h2 mt-4">Farzana Classroom</h2>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
              <p className="cn-body max-w-[48ch]">{farzana.line}</p>
              <Facts
                rows={[
                  ['For', farzana.forWhom],
                  ['Runs on', farzana.platforms],
                  ['Status', farzana.status],
                ]}
              />
            </div>
          </div>
          <Scroll prop="--q" className="cn-wrap cn-stage mt-14 pb-20 sm:mt-20 sm:pb-28">
            <div className="cn-tilt mx-auto max-w-[1180px]">
              <Browser shot={SHOTS.appClass} product={PRODUCT} priority />
            </div>
          </Scroll>
        </Scroll>

        <div className="cn-wrap grid gap-14 lg:grid-cols-2 lg:gap-10">
          <Scroll mode="reveal">
            <div className="cn-reveal">
              <Browser shot={SHOTS.appStudents} product={PRODUCT} />
            </div>
          </Scroll>
          <Scroll mode="reveal">
            <div className="cn-reveal lg:mt-32">
              <Browser shot={SHOTS.appAnalytics} product={PRODUCT} />
            </div>
          </Scroll>
        </div>
        <div className="cn-wrap mt-12">
          <div className="flex flex-wrap gap-3">
            <Link href={farzana.href!} className="cn-ghost">
              The Farzana Classroom story <span aria-hidden="true">→</span>
            </Link>
            <a href={farzana.site} className="cn-ghost">
              farzana.app <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* JAM Legio, the Latin learning game: phones at different depths. */}
      <section id="latin-game" tabIndex={-1} aria-labelledby="latin-h" className="mt-32 scroll-mt-16 sm:mt-48">
        <div className="cn-wrap">
          <p className="cn-kicker">02 · App</p>
          <h2 id="latin-h" className="cn-display cn-h2 mt-4">JAM Legio</h2>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="cn-body max-w-[48ch]">
                A Latin learning game for iPhone and Android. Students march a legion north across Italy, thirteen stops from Rōma to Gallia, and every city teaches one
                piece of the classical curriculum. Nine ways to drill the grammar, and a leaderboard to race each other
                on.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={LATIN_STORES.appStore} className="cn-ghost cn-store">
                  <AppStoreIcon /> App Store
                </a>
                <a href={LATIN_STORES.googlePlay} className="cn-ghost cn-store">
                  <PlayStoreIcon /> Google Play
                </a>
                <Link href="/latin-game" className="cn-ghost">
                  See JAM Legio <span aria-hidden="true">→</span>
                </Link>
              </div>
              <LatinPartner />
            </div>
            <Facts
              rows={[
                ['For', latin.forWhom],
                ['Runs on', latin.platforms],
                ['Status', latin.status],
              ]}
            />
          </div>
        </div>
        <div className="cn-wrap mt-12 pb-16 sm:mt-20 sm:pb-24">
          <div className="cn-apps">
            {[SHOTS.latinHome, SHOTS.latinMap, SHOTS.latinCase].map((s) => (
              <Phone key={s.src} shot={s} sizes={APP_PHONE_SIZES} />
            ))}
          </div>
        </div>
      </section>

      {/* Ruta: contract work, said plainly, with the crew app's own screens. */}
      <section id="ruta" tabIndex={-1} aria-labelledby="ruta-h" className="mt-24 scroll-mt-16 sm:mt-36">
        <div className="cn-wrap">
          <p className="cn-kicker">03 · Contract work</p>
          <h2 id="ruta-h" className="cn-display cn-h2 mt-4">Ruta</h2>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="cn-body max-w-[48ch]">
                Ruta is service-management software for landscaping and maintenance businesses: an office app, a phone
                app for the crews, and a portal for customers. I work on it as a contractor on Ruta’s team. The product
                is Ruta’s.
              </p>
              <ul className="mt-8 space-y-2.5">
                {RUTA_WORK.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-[#cfcbc3]">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fg)]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Facts
                rows={[
                  ['For', ruta.forWhom],
                  ['Role', 'Contractor on the team'],
                  ['Runs on', ruta.platforms],
                  ['Status', ruta.status],
                ]}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="https://getruta.com" target="_blank" rel="noopener noreferrer" className="cn-ghost">
                  getruta.com <span aria-hidden="true">↗</span>
                </a>
                <Link href="/ruta" className="cn-ghost">
                  More on Ruta <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="cn-wrap mt-12 pb-16 sm:mt-20 sm:pb-24">
          <div className="cn-apps">
            {[SHOTS.rutaQueue, SHOTS.rutaVisit, SHOTS.rutaTime].map((s) => (
              <Phone key={s.src} shot={s} sizes={APP_PHONE_SIZES} />
            ))}
          </div>
        </div>
      </section>

      {/* KCUPG: a website of my own design and build, with its dashboard and map. */}
      <section id="kcupg" tabIndex={-1} aria-labelledby="kcupg-h" className="mt-24 scroll-mt-16 sm:mt-36">
        <div className="cn-wrap">
          <p className="cn-kicker">04 · Website</p>
          <h2 id="kcupg-h" className="cn-display cn-h2 mt-4">KCUPG</h2>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="cn-body max-w-[48ch]">
                For local ministry in Kansas City, I built a dashboard of the city’s communities from North Africa to East Asia:
                people, languages and faiths, and the places to meet them, on one map.
              </p>
              <ul className="mt-8 space-y-2.5">
                {KCUPG_BUILT.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-[#cfcbc3]">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fg)]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Facts
                rows={[
                  ['For', 'Local ministry in Kansas City'],
                  ['Made', 'Designed and built by me'],
                  ['Runs on', kcupg.platforms],
                  ['Status', kcupg.status],
                ]}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={kcupg.href!} className="cn-ghost">
                  The KCUPG story <span aria-hidden="true">→</span>
                </Link>
                <a href={kcupg.site} target="_blank" rel="noopener noreferrer" className="cn-ghost">
                  kcupgs.com <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="cn-wrap mt-16 grid gap-14 sm:mt-20 lg:grid-cols-2 lg:gap-10">
          <Scroll mode="reveal">
            <div className="cn-reveal">
              <Browser shot={SHOTS.kcupgDashboard} product="KCUPG" />
            </div>
          </Scroll>
          <Scroll mode="reveal">
            <div className="cn-reveal lg:mt-32">
              <Browser shot={SHOTS.kcupgMap} product="KCUPG" />
            </div>
          </Scroll>
        </div>
      </section>

      {/* Everything else, short: a picture, a name, a line. */}
      <section id="more" tabIndex={-1} aria-labelledby="more-h" className="cn-wrap mt-24 scroll-mt-16 sm:mt-36">
        <p className="cn-kicker">05 · And the rest</p>
        <h2 id="more-h" className="cn-display cn-h2 mt-4">Websites, tools and other cool stuff.</h2>
        <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
          {CASES.map((p) => {
            const external = p.href!.startsWith('http')
            return (
              <Scroll mode="reveal" key={p.slug} className="flex">
                <a
                  href={p.href}
                  className="cn-reveal cn-case group block"
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span className="cn-shot cn-case-frame">
                    <Image src={p.card!.src} alt={p.card!.alt} width={p.card!.w} height={p.card!.h} loading="lazy" unoptimized />
                  </span>
                  <p className="cn-dim mt-6 text-sm">
                    {p.kind} · {p.forWhom}
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

      <section aria-label="Start a conversation" className="cn-wrap pb-28 pt-36 text-center sm:pb-40 sm:pt-48">
        <h2 className="cn-display cn-h1 mx-auto max-w-[12ch]">Yours could be next.</h2>
        <p className="cn-body mx-auto mt-6 max-w-[40ch]">
          Tell me what you have in mind. You talk to me, Thomas, the person who will build it, and you get a plan and a quote once I
          understand it.
        </p>
        <Link href={INQUIRE_PATH} className="cn-btn mt-10">
          {INQUIRE_CTA} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </CinematicChrome>
  )
}
