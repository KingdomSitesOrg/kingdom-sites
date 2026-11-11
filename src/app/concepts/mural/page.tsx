import Link from 'next/link'
import type { CSSProperties } from 'react'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { PHOTOS, PROJECTS, SHOTS, type Shot } from '@/lib/work'
import FlipTile from './_components/FlipTile'
import Fx from './_components/Fx'
import MosaicShot from './_components/MosaicShot'
import Strays from './_components/Strays'
import TileBand from './_components/TileBand'
import Wall from './_components/Wall'

/* The Mural concept's one page.

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
  text: string
  href: string
  window?: Shot
  phones?: Shot[]
}

const WORK: Work[] = [
  {
    name: project('farzana').name,
    chips: chips('farzana'),
    text: project('farzana').line,
    href: '/portfolio/farzana-classroom',
    window: SHOTS.appClass,
  },
  {
    name: project('latin-game').name,
    chips: chips('latin-game'),
    live: true,
    text: project('latin-game').line,
    href: '/latin-game',
    phones: [SHOTS.latinHome, SHOTS.latinMap, SHOTS.latinCase],
  },
  {
    name: project('ruta').name,
    chips: chips('ruta'),
    live: true,
    // The live home page's own line for Ruta.
    text: 'The crew app for landscaping businesses. I helped build it on Ruta’s team.',
    href: '/ruta',
    phones: [SHOTS.rutaQueue, SHOTS.rutaVisit, SHOTS.rutaTime],
  },
  {
    name: project('kcupg').name,
    chips: chips('kcupg'),
    live: true,
    text: project('kcupg').line,
    href: '/portfolio/kcupg',
    window: SHOTS.kcupgMap,
  },
]

/* More of the portfolio, as tiles that turn over: the project's name on the front, its line on the back. */
const MORE = [
  { slug: 'tap-to-tick', ground: '#F2581C', ink: '#0A0C12', pattern: ['X....', 'XX...', 'XXX..', 'XXXX.', 'XXXXX'] },
  { slug: 'delta', ground: '#2A5CFF', ink: '#F7F5F0', pattern: ['X.X.X', '.X.X.', 'X.X.X', '.X.X.', 'X.X.X'] },
  { slug: 'prayer', ground: '#14161D', ink: '#F7F5F0', pattern: ['XXXXX', 'X...X', 'X...X', 'X...X', 'XXXXX'] },
  { slug: 'ministry', ground: '#A9ACB1', ink: '#0A0C12', pattern: ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'] },
]

function Arrow() {
  return <span aria-hidden="true">→</span>
}

export default function MuralConcept() {
  return (
    <>
      <header className="mu-nav">
        <Link href="#top" className="mu-brand" data-snap>
          <span className="mu-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          Kingdom Sites
        </Link>
        <nav className="mu-links" aria-label="On this page">
          <Link href="#work" data-snap>
            Portfolio
          </Link>
          <Link href="#maker" data-snap>
            About
          </Link>
        </nav>
        <Fx />
        <Link href={INQUIRE_PATH} className="mu-nav-cta" data-snap>
          {INQUIRE_CTA}
        </Link>
      </header>

      <div id="top" />
      <Wall>
        <div className="mu-hero-copy" data-hero-copy>
          {/* Thomas's own line for the hero (2026-11-11). */}
          <h1 className="mu-h1">
            <span className="l" style={{ '--i': 0 } as CSSProperties}>
              Custom
            </span>
            <span className="l" style={{ '--i': 1 } as CSSProperties}>
              software
              <span className="mu-dot" aria-hidden="true" />
              <span className="mu-sr">.</span>
            </span>
          </h1>
          <p className="mu-sub">With every detail cared for, like a mural.</p>
          <div className="mu-cta">
            <Link href={INQUIRE_PATH} className="mu-btn" data-snap>
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
          <Strays seed={71} />
          <p className="mu-eyebrow" data-rise aria-hidden="true" />
          <h2 id="work-title" className="mu-h2" data-rise style={delay(60)}>
            Portfolio
          </h2>
        </div>

        <div className="mu-work">
          {WORK.map((w, n) => (
            <article key={w.name} className="mu-item">
              <div>
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
                <p className="mu-text" data-rise style={delay(150)}>
                  {w.text}
                </p>
                <div data-rise style={delay(200)}>
                  <Link href={w.href} className="mu-link" data-snap>
                    See {w.name} <Arrow />
                  </Link>
                </div>
              </div>

              <div className="mu-media" data-rise style={delay(80)}>
                {w.window ? (
                  <Link href={w.href} className="mu-window" style={{ '--sh': n % 2 ? 'var(--orange)' : 'var(--blue)' } as CSSProperties} data-snap>
                    <span className="mu-window-bar" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <span>{w.name}</span>
                    </span>
                    <MosaicShot {...w.window} sizes={WINDOW_SIZES} />
                  </Link>
                ) : (
                  <div className="mu-phones">
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
          <Strays seed={83} />
          <p className="mu-eyebrow" data-rise aria-hidden="true" />
          <h2 id="make-title" className="mu-h2" data-rise style={delay(60)}>
            Websites, tools and other cool stuff.
          </h2>
        </div>
        <div className="mu-flips">
          {MORE.map((m, i) => (
            <div key={m.slug} data-rise style={delay(i * 70)}>
              <FlipTile index={project(m.slug).kind} title={project(m.slug).name} body={project(m.slug).line} ground={m.ground} ink={m.ink} pattern={m.pattern} />
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
            <Strays seed={97} gem />
            <p className="mu-eyebrow" data-rise>
              Engineering: design, build, ship, maintain
            </p>
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
          <div className="mu-cta" data-rise style={delay(180)}>
            <Link href={INQUIRE_PATH} className="mu-btn" data-snap>
              {INQUIRE_CTA} <Arrow />
            </Link>
          </div>
          <footer className="mu-foot">
            <span>Kingdom Sites, 2026</span>
            <span>
              A concept page. <Link href="/">The live site</Link>
            </span>
          </footer>
        </div>
      </section>
    </>
  )
}
