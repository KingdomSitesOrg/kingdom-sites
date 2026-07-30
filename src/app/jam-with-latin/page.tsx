'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import shotHome from '../../../public/jam-with-latin/home.jpg'
import shotJourney from '../../../public/jam-with-latin/journey.jpg'
import shotCase from '../../../public/jam-with-latin/case-challenge.png'
import shotLeaderboard from '../../../public/jam-with-latin/leaderboard.jpg'
import shotMap from '../../../public/jam-with-latin/map.jpg'

/** Set these once each app is live and the buttons become real links. */
const APP_STORE_URL = ''
const PLAY_STORE_URL = ''

const LEARNING = [
  { icon: '🃏', title: 'Vocabulary cards', desc: 'Match the Latin word to its English meaning. Correct macrons throughout, so students learn the word as it is actually written.' },
  { icon: '⚖️', title: 'Case challenges', desc: 'Pick the correct case form of a noun from real, correctly-declined options — not near-misses invented to trick you.' },
  { icon: '🔤', title: 'Verb endings', desc: 'Connect each personal ending — ō, s, t, mus, tis, nt — to its person and number until it is second nature.' },
  { icon: '📖', title: 'Sentence reading', desc: 'Put the grammar together and read short, correct Latin sentences by the end of the march.' },
  { icon: '⚔️', title: 'Training mode', desc: 'Quick matching rounds any time, for the days when a full city is more than you have time for.' },
  { icon: '🗓️', title: 'Word of the day', desc: 'One new word on the home screen every day, to keep vocabulary ticking over between sessions.' },
]

function AppStoreIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.55.02-2.97.9-3.77 2.28-1.61 2.79-.41 6.92 1.15 9.19.76 1.11 1.67 2.35 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.24.87-1.28 1.23-2.53 1.25-2.59-.03-.01-2.4-.92-2.42-3.65zM14.9 5.4c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.68-1.09 1.77-.96 2.81 1.02.08 2.06-.52 2.69-1.28z" />
    </svg>
  )
}

/* The hamburger and its close state, for the menu that appears on phones. */
function MenuGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CloseGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

/** The two store buttons. Plain text until there is a real link to point at. */
function AppStoreButton() {
  if (!APP_STORE_URL) {
    return <span className="btn"><AppStoreIcon />Coming to the App Store</span>
  }
  return <a href={APP_STORE_URL} className="btn"><AppStoreIcon />Download on the App Store</a>
}

function PlayStoreButton() {
  if (!PLAY_STORE_URL) {
    return <span className="btn"><PlayStoreIcon />Coming to Google Play</span>
  }
  return <a href={PLAY_STORE_URL} className="btn"><PlayStoreIcon />Get it on Google Play</a>
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.jwl .reveal')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export default function JamWithLatin() {
  const headerRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  useReveal()

  return (
    <>
      <header ref={headerRef}>
        <nav>
          <div className="brand-row">
            {/* The way back to Kingdom Sites, anchored top left on every page,
                the same plain wordmark the main site uses. */}
            <Link href="/" className="ks-anchor">
              <span className="ks-name">Kingdom Sites</span>
            </Link>
            <span className="brand-sep" aria-hidden="true" />
            <div className="brand">
              <span className="crest" aria-hidden="true">L</span>
              Latin practice game
            </div>
          </div>
          <div className="nav-right">
            <div className="nav-links">
              <a href="#march">The march</a>
              <a href="#learn">How you learn</a>
              <a href="#screens">Screens</a>
            </div>
            {/* On phones the section links collapse into this, so there is always
                a menu whatever page you land on. */}
            <button
              type="button"
              className="nav-toggle"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <CloseGlyph /> : <MenuGlyph />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="mobile-menu">
            <a href="#march" onClick={() => setMenuOpen(false)}>The march</a>
            <a href="#learn" onClick={() => setMenuOpen(false)}>How you learn</a>
            <a href="#screens" onClick={() => setMenuOpen(false)}>Screens</a>
            <span className="mobile-menu-sep" aria-hidden="true" />
            <Link href="/" onClick={() => setMenuOpen(false)}>Kingdom Sites</Link>
            <Link href="/my-work" onClick={() => setMenuOpen(false)}>All my work</Link>
          </div>
        )}
      </header>

      {/* ============ HERO ============ */}
      <div className="hero">
        <div className="wrap">
          <span className="eyebrow">iPhone, iPad &amp; Android · Ages 4+ · Education</span>

          <h1>
            March from <span className="crimson">Rōma</span> to Gaul.<br />
            Learn <span className="gold">real Latin</span> on the way.
          </h1>

          <p className="sub">
            A Roman-legion adventure that teaches first-year classical Latin — <strong>declensions,
            verb endings, and sentences you can actually read</strong> — one city at a time.
          </p>

          <div className="cta-row">
            <AppStoreButton />
            <PlayStoreButton />
            <a href="#march" className="btn-ghost">See the journey</a>
          </div>

          <p className="note">
            <b>Built for homeschool and classical students.</b> No email, no ads.
          </p>
        </div>

        <div className="hero-shot">
          <div className="stage">
            <div className="phone">
              <Image src={shotJourney} alt="The journey hub: next city to enter, the map, and training" sizes="228px" placeholder="blur" />
            </div>
            <div className="phone lift">
              <Image src={shotHome} alt="Home screen: your legionary, current city, XP, and the word of the day" sizes="264px" priority />
            </div>
            <div className="phone">
              <Image src={shotCase} alt="A case challenge in the city of Rōma: choose the nominative singular of “earth, land”" sizes="228px" placeholder="blur" />
            </div>
          </div>
        </div>
      </div>

      {/* ============ THE MARCH ============ */}
      <section id="march">
        <div className="wrap split">
          <div className="copy reveal">
            <div className="kicker">The journey</div>
            <h2>Twelve stops, north across Italy.</h2>
            <p className="lede">
              Every city on the road teaches one piece of the classical curriculum, and the challenge
              grows as the legion marches. Clear all six words in a city to move on. Between the
              hard stretches, the <b>camp-outs</b> stop and review everything learned so far —
              which is where the grammar actually sticks.
            </p>
            <p className="lede">
              The map is a real map of Italy, so students can see where Vēiī sits relative to Rōma,
              and where the road turns west for Gaul.
            </p>
          </div>
          <div className="reveal">
            <div className="phone lift" style={{ margin: '0 auto' }}>
              <Image src={shotMap} alt="The campaign map of Italy with twelve numbered stops from Rōma north to Gaul" sizes="264px" placeholder="blur" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW YOU LEARN ============ */}
      <section id="learn" className="band-parchment">
        <div className="wrap">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <div className="kicker">How you learn</div>
            <h2>Six ways to drill the same grammar.</h2>
            <p className="lede" style={{ margin: '16px auto 0', textAlign: 'center' }}>
              Enough variety that practice does not feel like a worksheet.
            </p>
          </div>
          <div className="grid3">
            {LEARNING.map((l) => (
              <div key={l.title} className="card reveal">
                <div className="ic" aria-hidden="true">{l.icon}</div>
                <h3>{l.title}</h3>
                <p>{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLASSICAL ============ */}
      <section>
        <div className="wrap split flip">
          <div className="copy reveal">
            <div className="kicker">Built for classical students</div>
            <h2>Faithful to the grammar teachers teach.</h2>
            <p className="lede">
              The content follows the classical order — declensions, then verbs, then sentences — so
              it sits alongside <b>Henle</b>, <b>Classical Conversations</b>, and general classical
              curricula rather than competing with them.
            </p>
          </div>
          <div className="reveal">
            <div className="phone lift" style={{ margin: '0 auto' }}>
              <Image src={shotCase} alt="A case challenge with four declined Latin forms to choose between" sizes="264px" placeholder="blur" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ ARENA ============ */}
      <section className="band-navy">
        <div className="wrap split">
          <div className="copy reveal">
            <div className="kicker">The Colosseum</div>
            <h2>Something to march for.</h2>
            <p className="lede">
              Every correct answer earns XP, and the arena standings show who is furthest along the
              road to Gaul. It turns solitary vocabulary practice into a friendly contest — the part
              that keeps students coming back without any prompting from a parent.
            </p>
            <p className="lede">
              The leaderboard shows usernames and scores. Nothing else, because the app never asks
              for anything else.
            </p>
          </div>
          <div className="reveal">
            <div className="phone lift" style={{ margin: '0 auto' }}>
              <Image src={shotLeaderboard} alt="Arena standings with a champions' podium and ranked legionaries" sizes="264px" placeholder="blur" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ SCREENS ============ */}
      <section id="screens" className="band-parchment" style={{ paddingBottom: 52 }}>
        <div className="wrap reveal" style={{ textAlign: 'center' }}>
          <div className="kicker">Every screen</div>
          <h2>A look around the villa.</h2>
        </div>
        <div className="gallery">
          <div className="gshot">
            <Image src={shotHome} alt="Home screen with legionary, city progress and word of the day" sizes="208px" placeholder="blur" />
            <div className="cap">Home — your legionary &amp; the word of the day</div>
          </div>
          <div className="gshot">
            <Image src={shotJourney} alt="Journey hub with the next city and training" sizes="208px" placeholder="blur" />
            <div className="cap">Journey — next city, map, training</div>
          </div>
          <div className="gshot">
            <Image src={shotMap} alt="Map of Italy with the twelve numbered stops" sizes="208px" placeholder="blur" />
            <div className="cap">The march — twelve real stops</div>
          </div>
          <div className="gshot">
            <Image src={shotCase} alt="A case challenge in the city of Rōma" sizes="208px" placeholder="blur" />
            <div className="cap">Cities — case challenges to clear</div>
          </div>
          <div className="gshot">
            <Image src={shotLeaderboard} alt="Arena standings leaderboard" sizes="208px" placeholder="blur" />
            <div className="cap">Colosseum — arena standings</div>
          </div>
        </div>
      </section>

      {/* ============ SAFE ============ */}

      {/* ============ FINAL ============ */}
      <div className="final band-navy" id="get">
        <div className="wrap reveal">
          <h2>Salvē — your march begins now.</h2>
          <p className="sub" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Latin vocabulary, verb endings and sentences, as a Roman quest.
          </p>
          <div className="cta-row">
            <AppStoreButton />
            <PlayStoreButton />
          </div>
          <p className="note" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Coming to iPhone, iPad, and Android. Education · Ages 4+.
          </p>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <span>Built for Jam with Latin · {new Date().getFullYear()}</span>
          <span>
            <a href="https://www.jamwithlatin.com/" target="_blank" rel="noopener noreferrer">jamwithlatin.com</a>
            {' · '}
            <Link href="/my-work">Designed &amp; built by Kingdom Sites</Link>
          </span>
        </div>
      </footer>
    </>
  )
}
