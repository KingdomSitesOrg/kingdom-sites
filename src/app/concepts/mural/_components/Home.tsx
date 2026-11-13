import Link from 'next/link'
import { Fragment, type CSSProperties } from 'react'
import InquiryForm from '@/components/InquiryForm'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { REQUEST_CTA, REQUEST_PATH } from '@/lib/request'
import LatinPartner from '@/components/cinematic/LatinPartner'
import { PHOTOS, PROJECTS, SHOTS, type Shot } from '@/lib/work'
import FlipTile from './FlipTile'
import MuralHeader from './Header'
import GemHop from './GemHop'
import MosaicShot from './MosaicShot'
import Strays from './Strays'
import TileBand from './TileBand'
import Wall from './Wall'

/* The mural home page (also shown, marked as a concept, at /concepts/mural).

   Wording rule (Thomas, 2026-11-11): outside the hero, every word is the live
   site's own, unchanged. Lines may be moved, mixed and matched, never
   reworded. So the project names, kinds, platforms, statuses and lines come
   straight from PROJECTS (src/lib/work.ts), and the headings, labels and
   sentences are copied from the live home, Portfolio and About pages. The
   exceptions are his: the hero's headline and line, and the sentence about
   Monisha in About. The few labels that belong to the mural itself (Sound,
   Tap the wall, Turn it over, the concept note in the footer) are new. */

const project = (slug: string) => PROJECTS.find((p) => p.slug === slug)!
const chips = (slug: string) => [project(slug).kind, project(slug).platforms, project(slug).status]

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

const WINDOW_SIZES = '(min-width: 960px) 640px, 92vw'
const PHONE_SIZES = '(min-width: 640px) 170px, 30vw'

type Work = {
  name: string
  chips: string[]
  /** The last chip gets the blinking "live" tile. */
  live?: boolean
  /** The home page's heading that came before this piece. */
  lead?: string
  /** The home page's story about this piece, shown above its line. */
  story?: string
  text: string
  /** JAM Legio's partnership credit, as the home page carried it. */
  partner?: boolean
  /** The home page's question under this piece. */
  ask?: string
  /** Where its window leads, and what a screen reader calls that link. */
  href: string
  hrefLabel?: string
  /** The links under the piece, in the home page's own words. */
  links: { label: string; href: string; quiet?: boolean }[]
  window?: Shot
  phones?: Shot[]
}

/* The portfolio area carries the home page's own text from before the mural
   look (main up to 2026-11-11, e01c35a), word for word (Thomas, 2026-11-12,
   T-534): each piece's sentence, its links, "I also do mobile apps.", the
   question under Farzana Classroom, JAM Legio's partnership credit and STRATA.

   Thomas, 2026-11-12, after seeing it: each piece shows one screenshot of the
   app and one line, in his words, "Explore how and why this came to life",
   which opens the project's page. The "See …" link each piece had stays
   beside it, word for word, drawn quieter so his line is the main one. */
const EXPLORE = 'Explore how and why this came to life'
const WORK: Work[] = [
  {
    name: project('latin-game').name,
    chips: chips('latin-game'),
    live: true,
    lead: 'I build mobile apps.',
    text: 'A Latin learning game for iPhone and Android.',
    partner: true,
    href: '/latin-game',
    links: [
      { label: EXPLORE, href: '/latin-game' },
      { label: 'See JAM Legio', href: '/latin-game', quiet: true },
    ],
    phones: [SHOTS.latinHome],
  },
  {
    name: project('farzana').name,
    chips: chips('farzana'),
    lead: 'And the web portal behind them.',
    story: 'Someone asked me to build them custom classroom software.',
    text: 'Now it’s coming to life.',
    ask: 'Want software like this, or something else entirely?',
    href: '/portfolio/farzana-classroom',
    links: [
      { label: EXPLORE, href: '/portfolio/farzana-classroom' },
      { label: 'Book a Farzana demo', href: '/farzana/book' },
      { label: INQUIRE_CTA, href: '#talk' },
    ],
    window: SHOTS.appClass,
  },
  {
    name: project('ruta').name,
    chips: chips('ruta'),
    live: true,
    text: 'The crew app for landscaping businesses. I helped build it on Ruta’s team.',
    href: '/ruta',
    links: [
      { label: EXPLORE, href: '/ruta' },
      { label: 'See Ruta', href: '/ruta', quiet: true },
    ],
    phones: [SHOTS.rutaQueue],
  },
  {
    name: project('kcupg').name,
    chips: chips('kcupg'),
    live: true,
    text: 'A map of Kansas City’s communities, for local ministry.',
    href: '/portfolio/kcupg',
    links: [
      { label: EXPLORE, href: '/portfolio/kcupg' },
      { label: 'See KCUPG', href: '/portfolio/kcupg', quiet: true },
    ],
    window: SHOTS.kcupgMap,
  },
  {
    name: 'STRATA',
    chips: ['Concept site'],
    text: 'Don’t just think about a website. Think about an experience. See how far a website can go.',
    href: '/strata',
    hrefLabel: 'Open the STRATA concept site',
    links: [{ label: 'Open the concept site', href: '/strata' }],
    window: { src: '/strata/stills/fleet-1-desktop.webp', alt: 'Rows of 3D printers glowing in a dark hall, from the STRATA concept site', w: 1600, h: 1000 },
  },
]

/* More of the portfolio, as tiles that turn over: the project's name and line on the front, the line again in colour on the back, and a link to the project under each. */
const MORE = [
  { slug: 'tap-to-tick', ground: '#F2581C', ink: '#0A0C12', pattern: ['X....', 'XX...', 'XXX..', 'XXXX.', 'XXXXX'] },
  { slug: 'delta', ground: '#2A5CFF', ink: '#F7F5F0', pattern: ['X.X.X', '.X.X.', 'X.X.X', '.X.X.', 'X.X.X'] },
  { slug: 'prayer', ground: '#14161D', ink: '#F7F5F0', pattern: ['XXXXX', 'X...X', 'X...X', 'X...X', 'XXXXX'] },
  { slug: 'ministry', ground: '#A9ACB1', ink: '#0A0C12', pattern: ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'] },
]

function Arrow() {
  return <span aria-hidden="true">→</span>
}

/** `concept` adds the footer's note that this is a trial page, with a way back to the live site. */
export default function MuralHome({ concept = false }: { concept?: boolean }) {
  return (
    <>
      <MuralHeader home />

      <div id="top" />
      <Wall>
        <div className="mu-hero-copy" data-hero-copy>
          {/* Thomas's own line for the hero (2026-11-11). */}
          <h1 className="mu-h1">
            <span className="l" style={{ '--i': 0 } as CSSProperties}>
              Custom
            </span>
            <span className="l" style={{ '--i': 1 } as CSSProperties}>
              mobile{' '}
              {/* The last word and the square stay together, so the full stop never drops to a line of its own. */}
              <span className="mu-nowrap">
                apps
                <span className="mu-dot" aria-hidden="true" />
                <span className="mu-sr">.</span>
              </span>
            </span>
          </h1>
          {/* The line Thomas picked on 2026-11-11: who it is for first, then his mural sentence. */}
          <p className="mu-sub">
            I build custom mobile apps for businesses. I also do other custom work, such as a matching web app or a website to go with it. <span className="mu-sub-2">Every detail cared for, like a mural.</span>
          </p>
          <div className="mu-cta">
            {/* Submit a request (T-547) beside the existing two. */}
            <Link href={REQUEST_PATH} className="mu-btn" data-snap>
              {REQUEST_CTA} <Arrow />
            </Link>
            <Link href="#talk" className="mu-btn is-ink" data-snap>
              {INQUIRE_CTA} <Arrow />
            </Link>
            <Link href="#work" className="mu-btn is-ghost" data-snap>
              See all my work <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>
      </Wall>

      <section id="work" className="mu-section" aria-labelledby="work-title">
        <div className="mu-head">
          <p className="mu-eyebrow" data-rise aria-hidden="true" />
          <h2 id="work-title" className="mu-h2" data-rise style={delay(60)}>
            Portfolio
          </h2>
        </div>

        <div className="mu-work">
          {WORK.map((w, n) => (
            <article key={w.name} className="mu-item">
              <div>
                {w.lead ? (
                  <p className={`mu-lead${n === 1 ? ' is-sub' : ''}`} data-rise>
                    {w.lead}
                  </p>
                ) : null}
                <span className="mu-num" data-rise>
                  {String(n + 1).padStart(2, '0')}
                </span>
                <h3 className="mu-name" data-rise style={delay(50)}>
                  {w.name}
                </h3>
                <ul className="mu-chips" data-rise style={delay(100)}>
                  {w.chips.map((chip, i) => (
                    <li key={chip} className={`mu-chip${w.live && i === w.chips.length - 1 ? ' is-live' : ''}`}>
                      {chip}
                    </li>
                  ))}
                </ul>
                {w.story ? (
                  <p className="mu-story" data-rise style={delay(130)}>
                    {w.story}
                  </p>
                ) : null}
                <p className="mu-text" data-rise style={delay(150)}>
                  {w.text}
                </p>
                {w.partner ? (
                  <div data-rise style={delay(170)}>
                    <LatinPartner className="mu-partner" />
                  </div>
                ) : null}
                {w.ask ? (
                  <p className="mu-story" data-rise style={delay(180)}>
                    {w.ask}
                  </p>
                ) : null}
                <div className="mu-links-row" data-rise style={delay(200)}>
                  {w.links.map((l) => (
                    <Link key={l.label} href={l.href} className={`mu-link${l.quiet ? ' is-quiet' : ''}`} data-snap>
                      {l.label} <Arrow />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mu-media" data-rise style={delay(80)}>
                {w.window ? (
                  <Link href={w.href} className="mu-window" aria-label={w.hrefLabel} style={{ '--sh': n % 2 ? 'var(--orange)' : 'var(--blue)' } as CSSProperties} data-snap>
                    <span className="mu-window-bar" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <span>{w.name}</span>
                    </span>
                    <MosaicShot {...w.window} sizes={WINDOW_SIZES} />
                  </Link>
                ) : (
                  <div className={`mu-phones${w.phones?.length === 1 ? ' is-one' : ''}`}>
                    {w.phones?.map((shot, i) => (
                      <div key={shot.src} className="mu-phone">
                        <MosaicShot {...shot} sizes={PHONE_SIZES} delay={i * 130} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <p className="mu-more" data-rise>
          <Link href="/portfolio" className="mu-btn is-ink" data-snap>
            See all my work <Arrow />
          </Link>
        </p>
      </section>

      <section id="make" className="mu-section" aria-labelledby="make-title">
        <div className="mu-head">
          <p className="mu-eyebrow" data-rise aria-hidden="true" />
          <h2 id="make-title" className="mu-h2" data-rise style={delay(60)}>
            Websites, tools and other cool stuff.
          </h2>
        </div>
        <div className="mu-flips">
          {MORE.map((m, i) => (
            <div key={m.slug} className="mu-flip-cell" data-rise style={delay(i * 70)}>
              <FlipTile index={project(m.slug).kind} title={project(m.slug).name} body={project(m.slug).line} ground={m.ground} ink={m.ink} pattern={m.pattern} />
              <Link href={project(m.slug).href ?? '/portfolio'} className="mu-link" data-snap>
                See {project(m.slug).name} <Arrow />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="maker" className="mu-section" aria-labelledby="maker-title">
        <div className="mu-maker">
          <div className="mu-window" data-rise>
            <span className="mu-window-bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>Thomas and Monisha</span>
            </span>
            <MosaicShot {...PHOTOS.evening} sizes="(min-width: 960px) 420px, 88vw" />
          </div>
          <div className="mu-head">
            <Strays seed={97} />
            {/* Each word is marked so the creature can hop along them (GemHop.tsx). */}
            <p className="mu-eyebrow" data-rise>
              <span className="mu-hop-words">
                {['Engineering:', 'design,', 'build,', 'ship,', 'maintain'].map((word, i) => (
                  <Fragment key={word}>
                    {i ? ' ' : null}
                    <span data-hop>{word}</span>
                  </Fragment>
                ))}
              </span>
            </p>
            <GemHop />
            <h2 id="maker-title" className="mu-h2" data-rise style={delay(60)}>
              Thomas Klein
            </h2>
            <p className="mu-text" data-rise style={delay(120)}>
              I design, build, ship and maintain everything myself, on purpose, so you always know who you are talking to. I am married to my wife Monisha, and love serving others.
            </p>
            <div data-rise style={delay(180)}>
              <Link href="/about" className="mu-link" data-snap>
                About <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TileBand />
      <section id="talk" className="mu-close" aria-labelledby="talk-title">
        <div className="mu-close-in">
          <p className="mu-eyebrow" data-rise aria-hidden="true" />
          <h2 id="talk-title" className="mu-h2" data-rise style={delay(60)}>
            Yours could be next.
          </h2>
          <p className="mu-text" data-rise style={delay(120)}>
            A website, an app, or AI put to work: tell me what you have in mind.
          </p>
          {/* The fuller request form (T-547), above the short note. */}
          <div className="mu-cta mu-close-cta" data-rise style={delay(150)}>
            <Link href={REQUEST_PATH} className="mu-btn" data-snap>
              {REQUEST_CTA} <Arrow />
            </Link>
          </div>
          {/* The live home page's own form: a visitor writes without leaving the page. */}
          <div className="mu-form" data-rise style={delay(180)}>
            <InquiryForm />
          </div>
          {/* The live site's footer, word for word, plus the concept note. */}
          <footer className="mu-foot">
            <span>© 2026 Kingdom Sites · Rochester, Minnesota</span>
            <span className="mu-foot-links">
              <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>
              <Link href="/ai-tooling">AI consultation</Link>
              <Link href="/prayer">Prayer</Link>
              <Link href={INQUIRE_PATH}>{INQUIRE_CTA}</Link>
            </span>
            {concept ? (
              <span>
                A concept page. <Link href="/">The live site</Link>
              </span>
            ) : null}
          </footer>
        </div>
      </section>
    </>
  )
}
