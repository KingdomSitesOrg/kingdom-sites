import Link from 'next/link'
import type { CSSProperties } from 'react'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { PHOTOS, SHOTS, type Shot } from '@/lib/work'
import FlipTile from './_components/FlipTile'
import Fx from './_components/Fx'
import MosaicShot from './_components/MosaicShot'
import Strays from './_components/Strays'
import TileBand from './_components/TileBand'
import Wall from './_components/Wall'

/* The Mural concept's one page. Every line about the work is the wording the
   live site already uses (src/lib/work.ts, src/lib/case-studies.ts): nothing
   here is a new claim. */

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
    name: 'Farzana Classroom',
    chips: ['Platform', 'Web, phone and desktop', 'In beta'],
    text: 'Running email campaigns, managing students, payments and products is hard when it is spread across different tools. Farzana Classroom combines it all. I built it from the ground up.',
    href: '/portfolio/farzana-classroom',
    window: SHOTS.appClass,
  },
  {
    name: 'JAM Legio',
    chips: ['App', 'iPhone and Android', 'On the App Store and Google Play'],
    live: true,
    text: 'A Latin learning game. Students travel the Roman world city by city, answer case challenges and race each other on the leaderboard.',
    href: '/latin-game',
    phones: [SHOTS.latinHome, SHOTS.latinMap, SHOTS.latinCase],
  },
  {
    name: 'Ruta',
    chips: ['Contract', 'Web, iPhone and Android', 'Live'],
    live: true,
    text: 'The crew app for landscaping businesses. I helped build a live platform on Ruta’s team: the office app, the customer portal and the crew’s phone app.',
    href: '/ruta',
    phones: [SHOTS.rutaQueue, SHOTS.rutaVisit, SHOTS.rutaTime],
  },
  {
    name: 'KCUPG',
    chips: ['Website', 'Web, no sign-in', 'Live'],
    live: true,
    text: 'Kansas City’s communities from North Africa to East Asia on one map: people, languages and faith. I built the dashboard and the map.',
    href: '/portfolio/kcupg',
    window: SHOTS.kcupgMap,
  },
]

const MAKE = [
  {
    title: 'Websites',
    body: 'A site that says what you do, shows up in search, and that you can update yourself.',
    ground: '#F2581C',
    ink: '#0A0C12',
    pattern: ['X....', 'XX...', 'XXX..', 'XXXX.', 'XXXXX'],
  },
  {
    title: 'iPhone and Android apps',
    body: 'Designed, built and published on the App Store and Google Play under your name, and kept working as phones update.',
    ground: '#2A5CFF',
    ink: '#F7F5F0',
    pattern: ['X.X.X', '.X.X.', 'X.X.X', '.X.X.', 'X.X.X'],
  },
  {
    title: 'Custom software',
    body: 'Your name, your customers, your data, on software built around how you work.',
    ground: '#14161D',
    ink: '#F7F5F0',
    pattern: ['XXXXX', 'X...X', 'X...X', 'X...X', 'XXXXX'],
  },
  {
    title: 'AI consultation',
    body: 'I help you use AI to bring in more revenue, save time and grow your business. I have built AI into this website, Ruta and Farzana.',
    ground: '#A9ACB1',
    ink: '#0A0C12',
    pattern: ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'],
  },
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
            Work
          </Link>
          <Link href="#make" data-snap>
            What I make
          </Link>
          <Link href="#maker" data-snap>
            About
          </Link>
        </nav>
        <Fx />
        <Link href={INQUIRE_PATH} className="mu-nav-cta" data-snap>
          Start
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
              See the work <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>
      </Wall>

      <section id="work" className="mu-section" aria-labelledby="work-title">
        <div className="mu-head">
          <Strays seed={71} />
          <p className="mu-eyebrow" data-rise>
            Work
          </p>
          <h2 id="work-title" className="mu-h2" data-rise style={delay(60)}>
            What I have built.
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
          <p className="mu-eyebrow" data-rise>
            What I make
          </p>
          <h2 id="make-title" className="mu-h2" data-rise style={delay(60)}>
            Four things I can build for you.
          </h2>
        </div>
        <div className="mu-flips">
          {MAKE.map((m, i) => (
            <div key={m.title} data-rise style={delay(i * 70)}>
              <FlipTile index={String(i + 1).padStart(2, '0')} {...m} />
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
            <p className="mu-eyebrow" data-rise>
              Who builds it
            </p>
            <h2 id="maker-title" className="mu-h2" data-rise style={delay(60)}>
              Thomas Klein.
            </h2>
            <p className="mu-text" data-rise style={delay(120)}>
              I am a software engineer. I design, build, ship and maintain apps and the systems behind them. I am the person who does the work, and I stay after launch.
            </p>
            <div data-rise style={delay(180)}>
              <Link href="/about" className="mu-link" data-snap>
                More about me <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TileBand />
      <section id="talk" className="mu-close" aria-labelledby="talk-title">
        <div className="mu-close-in">
          <p className="mu-eyebrow" data-rise>
            Your turn
          </p>
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
