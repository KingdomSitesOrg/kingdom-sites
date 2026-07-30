'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import shotOverview from '../../../public/tap-to-tick/overview.png'
import shotLog from '../../../public/tap-to-tick/log.png'
import shotHistory from '../../../public/tap-to-tick/history.png'
import shotAccounts from '../../../public/tap-to-tick/accounts.png'

const APP_STORE_URL = 'https://apps.apple.com/us/app/tap-to-tick/id6791948663'

function AppStoreIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.55.02-2.97.9-3.77 2.28-1.61 2.79-.41 6.92 1.15 9.19.76 1.11 1.67 2.35 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.24.87-1.28 1.23-2.53 1.25-2.59-.03-.01-2.4-.92-2.42-3.65zM14.9 5.4c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.68-1.09 1.77-.96 2.81 1.02.08 2.06-.52 2.69-1.28z" />
    </svg>
  )
}

function Tick({ width = 14, stroke = 13 }: { width?: number; stroke?: number }) {
  return (
    <svg width={width} height={width} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M22 52l18 18 38-40" stroke="#fff" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AppStoreButton({ ghost = false }: { ghost?: boolean }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn${ghost ? ' ghost' : ''}`}
    >
      <AppStoreIcon />
      Download on the App Store
    </a>
  )
}

const CHIPS = [
  { label: 'Groceries', icon: '🥕', color: 'var(--green)' },
  { label: 'Dining',    icon: '🍴', color: 'var(--orange)' },
  { label: 'Gas',       icon: '⛽', color: 'var(--red)' },
  { label: 'Shopping',  icon: '🛍️', color: 'var(--purple)' },
  { label: 'Bills',     icon: '📄', color: 'var(--blue)' },
  { label: 'Fun',       icon: '🎮', color: 'var(--pink)' },
  { label: 'Other',     icon: '🏷️', color: 'var(--grey)' },
]

const BARS = [
  { name: 'Groceries', value: '$85.50 of $400',   width: '21%', color: 'var(--green)' },
  { name: 'Dining',    value: '$16.00 of $150',   width: '11%', color: 'var(--orange)' },
  { name: 'Gas',       value: '$85.50 of $90',    width: '95%', color: 'var(--red)' },
  { name: 'Bills',     value: '$1,200 of $1,400', width: '86%', color: 'var(--blue)' },
  { name: 'Fun',       value: '$15.99 — no limit', width: '9%', color: 'var(--pink)' },
]

/** Fades sections in as they arrive, and fills the budget bars once on screen. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.ttt .reveal')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('in')
          e.target.querySelectorAll<HTMLElement>('.bar span').forEach((b, i) => {
            setTimeout(() => { b.style.width = b.dataset.w ?? '0' }, 120 + i * 110)
          })
          io.unobserve(e.target)
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -60px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/** Hairline under the sticky nav once the page starts scrolling. */
function useStuckHeader(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const check = () => ref.current?.classList.toggle('stuck', window.scrollY > 8)
    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [ref])
}

export default function TapToTick() {
  const headerRef = useRef<HTMLElement>(null)
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted]     = useState(true)

  useReveal()
  useStuckHeader(headerRef)

  // Stop the demo video once it scrolls out of view.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) if (!e.isIntersecting) video.pause() },
      { threshold: 0.2 }
    )
    io.observe(video)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <header ref={headerRef}>
        <nav>
          <div className="brand">
            <span className="mark"><Tick /></span>
            Tap to Tick
          </div>
          <div className="nav-right">
            <div className="nav-links">
              <a href="#how">How it works</a>
              <a href="#cash">Cash</a>
              <a href="#screens">Screens</a>
              <a href="#pricing">Pricing</a>
              <a href="#ai">AI</a>
            </div>
            {/* Always reachable, and deliberately not one of the product links. */}
            <Link href="/my-work" className="home-link">Kingdom Sites</Link>
            <a href="#get" className="btn-sm">Get it</a>
          </div>
        </nav>
      </header>

      {/* ============ HERO ============ */}
      <div className="hero">
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot"><Tick width={9} stroke={14} /></span>
            iPhone · Apple Watch · Lock screen
          </span>

          <h1>
            Log it.<br />
            <span className="tick-word">
              Tick.
              <svg className="underline" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 26 C 60 38, 150 36, 296 12" />
              </svg>
            </span>{' '}
            <span className="fade">Done.</span>
          </h1>

          <p className="sub">
            An easy way to log and track transactions — <strong>including the cash in your pocket</strong>.
            Two taps from the lock screen, and it&apos;s in the books.
          </p>

          <div className="cta-row">
            <AppStoreButton />
            <a href="#demo" className="btn ghost">See how it works</a>
          </div>

          <p className="note"><b>Free to use.</b> No account to create, no ads, no tracking.</p>

          <div className="chips">
            {CHIPS.map((c, i) => (
              <span key={c.label} className="chip" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                <i style={{ background: c.color }}>{c.icon}</i>
                {c.label}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-shot">
          <div className="stage">
            <div className="phone">
              <Image src={shotLog} alt="Logging an expense: amount keypad and colored category buttons" sizes="232px" placeholder="blur" />
            </div>
            <div className="phone lift">
              <Image src={shotOverview} alt="Overview screen: account balances, wallet cash, and a spending-by-category ring" sizes="268px" priority />
            </div>
            <div className="phone">
              <Image src={shotHistory} alt="History screen listing recent transactions" sizes="232px" placeholder="blur" />
            </div>
          </div>
        </div>
      </div>

      {/* ============ HOW ============ */}
      <section id="how">
        <div className="wrap split">
          <div className="copy reveal">
            <div className="kicker">01 — Two seconds</div>
            <h2>Log it before the receipt prints.</h2>
            <p className="lede">
              The widget sits on your lock screen with today&apos;s running total. Raise the phone,
              tap, punch in the amount, pick a category. Pocket it. No unlocking, no app hunting,
              no spreadsheet — which is exactly why it sticks.
            </p>
          </div>
          <div className="reveal">
            <div className="lock">
              <div className="date">Wednesday, July 15</div>
              <div className="time">10:59</div>
              <div className="widgets">
                <div className="lw">
                  <div className="lbl">Today</div>
                  <div className="val">$47.00</div>
                </div>
                <div className="lw tap"><span className="plus">+</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HANDS-FREE ============ */}
      <section className="band">
        <div className="wrap">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <div className="kicker">02 — Everywhere else</div>
            <h2>Or don&apos;t even touch it.</h2>
            <p className="lede" style={{ margin: '16px auto 0', textAlign: 'center' }}>
              Three more ways in, for when your hands are full of groceries.
            </p>
          </div>
          <div className="grid3">
            <div className="card reveal">
              <div className="ic" style={{ background: 'var(--blue)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="2" y="6" width="20" height="13" rx="2.5" /><path d="M2 10.5h20" />
                </svg>
              </div>
              <h3>Apple Pay logs itself</h3>
              <p>Tap once for Apple Pay. Tap once more to log it — exact amount, no typing, straight into whichever category you choose.</p>
            </div>
            <div className="card reveal">
              <div className="ic" style={{ background: 'var(--ink)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="3.5" /><path d="M20 10v4M9 6l.6-3h4.8l.6 3M9 18l.6 3h4.8l.6-3" />
                </svg>
              </div>
              <h3>From your wrist</h3>
              <p>Dial an amount with the crown, tap a category, hit Log. It lands on your phone from across the house — no phone in hand at all.</p>
            </div>
            <div className="card reveal">
              <div className="ic" style={{ background: 'var(--purple)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
                </svg>
              </div>
              <h3>Just ask Siri</h3>
              <p>&quot;Hey Siri, log a purchase in Tap to Tick.&quot; It opens straight to the keypad with the category buttons waiting. Hands-free, mid-checkout.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CASH ============ */}
      <section id="cash">
        <div className="wrap split flip">
          <div className="copy reveal">
            <div className="kicker">03 — The part other apps miss</div>
            <h2>Cash that actually adds up.</h2>
            <p className="lede">
              Pulling $100 from an ATM isn&apos;t spending — it&apos;s moving money from the bank into your
              pocket. Tap to Tick knows the difference. Mark a purchase <b>paid with cash</b> and
              it spends your wallet down instead of your checking. Bank, savings, and pocket money
              all stay true at once.
            </p>
          </div>
          <div className="reveal">
            <div className="demo">
              <div className="flow">
                <div className="fnode">
                  <span className="ic" style={{ background: 'var(--blue)' }}>🏦</span>
                  <span>
                    <span className="t">Checking</span>
                    <span className="d">Where the paycheck lands</span>
                  </span>
                  <span className="amt">$1,500.00</span>
                </div>
                <div className="farrow">↓ &nbsp;ATM Cash — moves money, isn&apos;t spending</div>
                <div className="fnode">
                  <span className="ic" style={{ background: 'var(--orange)' }}>💵</span>
                  <span>
                    <span className="t">Wallet cash</span>
                    <span className="d">Out of the machine, into your pocket</span>
                  </span>
                  <span className="amt up">+$100.00</span>
                </div>
                <div className="farrow">↓ &nbsp;Coffee, marked &quot;paid with cash&quot;</div>
                <div className="fnode">
                  <span className="ic" style={{ background: 'var(--orange)' }}>🍴</span>
                  <span>
                    <span className="t">Dining</span>
                    <span className="d">Spends the wallet, not the bank</span>
                  </span>
                  <span className="amt dn">−$4.50</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ RECURRING ============ */}
      <section className="band">
        <div className="wrap split">
          <div className="copy reveal">
            <div className="kicker">04 — Set once</div>
            <h2>Rent posts itself.</h2>
            <p className="lede">
              Rent, paychecks, subscriptions — set them up once with a day of the month.
              Every month they log themselves on the right day. Editable like any other entry,
              pausable any time, never typed twice.
            </p>
          </div>
          <div className="reveal">
            <div className="demo">
              <div className="rrow">
                <span className="day">1<small>DAY</small></span>
                <span>
                  <span className="t">Rent</span><br />
                  <span className="s">Bills · Checking</span>
                </span>
                <span className="amt">−$1,200</span>
              </div>
              <div className="rrow">
                <span className="day">15<small>DAY</small></span>
                <span>
                  <span className="t">Paycheck</span> <span className="badge-auto">AUTO</span><br />
                  <span className="s">Income · Checking</span>
                </span>
                <span className="amt" style={{ color: 'var(--green-dk)' }}>+$1,250</span>
              </div>
              <div className="rrow">
                <span className="day">22<small>DAY</small></span>
                <span>
                  <span className="t">Streaming</span><br />
                  <span className="s">Fun · Checking</span>
                </span>
                <span className="amt">−$15.99</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ OVERVIEW ============ */}
      <section>
        <div className="wrap split flip">
          <div className="copy reveal">
            <div className="kicker">05 — The picture</div>
            <h2>See exactly where it goes.</h2>
            <p className="lede">
              A ring of your month by category. Budgets with progress bars that tell you where you
              stand before you overshoot. Income against spending over time. And every balance —
              checking, savings, taxes, wallet — on one screen. Group the small stuff into
              subcategories like <b>Coffee</b> under <b>Dining</b>.
            </p>
          </div>
          <div className="reveal">
            <div className="demo">
              {BARS.map((b) => (
                <div key={b.name} className="bar-row">
                  <div className="bar-top"><span className="n">{b.name}</span><span className="v">{b.value}</span></div>
                  <div className="bar"><span data-w={b.width} style={{ '--w': b.width, background: b.color } as React.CSSProperties} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ ASK (AI) ============ */}
      <section id="ask" className="band">
        <div className="wrap split">
          <div className="copy reveal">
            <div className="kicker">06 — Ask<span className="tag-adv">Advanced</span></div>
            <h2>A money coach that reads your numbers.</h2>
            <p className="lede">
              Ask anything in plain English and get an answer built from <b>your own</b> entries,
              budgets and balances — not generic advice. It leads with the one thing worth changing,
              compares this month against last, and tells you where the money actually went.
            </p>
          </div>
          <div className="reveal">
            <div className="demo">
              <div className="chat">
                <div className="bubble me">Where am I losing money?</div>
                <div className="bubble ai">
                  Gas is at <b>95% of your $90 budget</b> with nine days to go, and Dining is running
                  $40 above last month. One fewer fill-up puts you back under.
                </div>
                <div className="bubble me">How much did I spend on cash this week?</div>
                <div className="typing" aria-hidden="true"><i /><i /><i /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SHARING ============ */}
      <section id="together">
        <div className="wrap split flip">
          <div className="copy reveal">
            <div className="kicker">07 — Together<span className="tag-adv">Advanced</span></div>
            <h2>One budget, two people.</h2>
            <p className="lede">
              Invite the person you share money with straight from the share sheet. You both log into
              the same ledger over <b>your own iCloud</b>, you both see the same totals, and every
              entry shows who logged it — so nobody has to ask where the money went.
            </p>
          </div>
          <div className="reveal">
            <div className="demo">
              <div className="people">
                <span className="who" style={{ background: 'var(--blue)' }}>T</span>
                <span className="thread" />
                <span className="who" style={{ background: 'var(--pink)' }}>M</span>
              </div>
              <div className="flow" style={{ marginTop: 22 }}>
                <div className="fnode">
                  <span className="ic" style={{ background: 'var(--green)' }}>🥕</span>
                  <span>
                    <span className="t">Safeway</span>
                    <span className="d">Groceries · logged by Monisha</span>
                  </span>
                  <span className="amt dn">−$58.15</span>
                </div>
                <div className="fnode">
                  <span className="ic" style={{ background: 'var(--red)' }}>⛽</span>
                  <span>
                    <span className="t">Chevron</span>
                    <span className="d">Gas · logged by Thomas</span>
                  </span>
                  <span className="amt dn">−$44.90</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SCREENS ============ */}
      <section id="screens" className="band" style={{ paddingBottom: 56 }}>
        <div className="wrap reveal" style={{ textAlign: 'center' }}>
          <div className="kicker">08 — Every screen</div>
          <h2>The whole app.</h2>
          <p className="lede" style={{ margin: '16px auto 0', textAlign: 'center' }}>
            There isn&apos;t much to it. That&apos;s the point.
          </p>
        </div>
        <div className="gallery">
          <div className="gshot">
            <Image src={shotOverview} alt="Overview: balances, wallet cash, spending ring" sizes="216px" placeholder="blur" />
            <div className="cap">Overview — balances &amp; the ring</div>
          </div>
          <div className="gshot">
            <Image src={shotLog} alt="Add expense: keypad, category buttons, paid-with-cash toggle" sizes="216px" placeholder="blur" />
            <div className="cap">Log — two taps, cash toggle</div>
          </div>
          <div className="gshot">
            <Image src={shotHistory} alt="History: recent transactions filtered by person" sizes="216px" placeholder="blur" />
            <div className="cap">History — who logged what</div>
          </div>
          <div className="gshot">
            <Image src={shotAccounts} alt="Accounts: checking, savings and wallet cash balances" sizes="216px" placeholder="blur" />
            <div className="cap">Accounts — every balance</div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing">
        <div className="wrap reveal" style={{ textAlign: 'center' }}>
          <div className="kicker">09 — Pricing</div>
          <h2>Two ways to use it.</h2>
          <p className="lede" style={{ margin: '16px auto 0', textAlign: 'center' }}>
            Start free. Add sharing and the AI coach whenever you want them.
          </p>

          <div className="plans">
            <div className="plan">
              <h3>Simple</h3>
              <div className="price">Free</div>
              <p className="plan-note">Everything you need to track your own money, on your own devices.</p>
              <ul>
                <li>Lock Screen widget logging</li>
                <li>Apple Watch and Siri logging</li>
                <li>Apple Pay purchases in one extra tap</li>
                <li>Cash, checking, savings and tax accounts</li>
                <li>Recurring rent, paychecks and subscriptions</li>
                <li>Category budgets, subcategories and CSV export</li>
                <li>iCloud sync across your own devices</li>
              </ul>
              <p className="footnote">No account to create. No ads. No tracking.</p>
            </div>

            <div className="plan featured">
              <div className="flag">Sharing + AI</div>
              <h3>Advanced</h3>
              <div className="price">$4.99 <small>/ month</small></div>
              <p className="plan-note">For households sharing a budget, and anyone who wants the numbers explained.</p>
              <ul>
                <li>Everything in Simple</li>
                <li>Share one budget with another person over iCloud</li>
                <li>See who logged every entry</li>
                <li>Ask: an AI coach that reads your own numbers</li>
                <li>Spending insights and month-to-month comparisons</li>
                <li>New Advanced features as they ship</li>
              </ul>
              <p className="footnote">
                Billed through your Apple ID. Cancel any time in App Store settings — your budget
                stays, sharing and Ask simply switch off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRIVACY ============ */}
      <section id="privacy" className="band">
        <div className="wrap privacy reveal">
          <div className="shield">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2.5l7.5 3v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6z" />
              <path d="M8.8 12.2l2.2 2.2 4.2-4.6" />
            </svg>
          </div>
          <h2>Your money is nobody&apos;s business.</h2>
          <p className="lede" style={{ margin: '16px auto 0', textAlign: 'center' }}>
            There is no account to make and no budget database to hack, because there isn&apos;t one.
            Every transaction lives on your phone and syncs through your own iCloud. The only thing
            that ever leaves is a question you type into Ask — and only when you ask it.
          </p>
          <div className="pills">
            <span className="pill">No sign-up</span>
            <span className="pill">No bank linking</span>
            <span className="pill">No tracking</span>
            <span className="pill">No ads</span>
            <span className="pill">Your iCloud, not our servers</span>
            <span className="pill">Works offline</span>
          </div>
          <p className="note" style={{ marginTop: 24 }}>
            <Link href="/tap-to-tick/privacy" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Read the full privacy policy
            </Link>
          </p>
        </div>
      </section>

      {/* ============ DEMO ============ */}
      <section id="demo">
        <div className="wrap reveal" style={{ textAlign: 'center' }}>
          <div className="kicker">10 — See it in action</div>
          <h2>Watch it happen.</h2>
          <p className="lede" style={{ margin: '16px auto 28px', textAlign: 'center' }}>
            The whole flow, start to finish.
          </p>
          <div
            className={`demo-frame${playing ? ' playing' : ''}`}
            onClick={() => {
              const video = videoRef.current
              if (!video) return
              if (video.paused) video.play()
              else video.pause()
            }}
          >
            <video
              ref={videoRef}
              src="/tap-to-tick/tap-to-tick.mp4"
              playsInline
              muted={muted}
              loop
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <div className="demo-play">
              <span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ink)" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </div>
            <button
              className="demo-sound"
              type="button"
              aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
              aria-pressed={!muted}
              onClick={(e) => { e.stopPropagation(); setMuted((m) => !m) }}
            >
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 9v6h4l5 5V4L8 9H4z" /><line x1="19" y1="8" x2="23" y2="16" /><line x1="23" y1="8" x2="19" y2="16" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 9v6h4l5 5V4L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19.5 5.5a9 9 0 0 1 0 13" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ============ AI ============ */}
      <section id="ai" className="band">
        <div className="wrap">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <div className="kicker">11 — The AI behind Ask</div>
            <h2>How the coach actually works.</h2>
            <p className="lede" style={{ margin: '16px auto 0', textAlign: 'center' }}>
              The interesting part of an AI feature is not the model — it is everything around it.
              Ask only works because the app knows which of your own numbers matter to the question,
              sends just those, and turns the answer into one thing worth doing.
            </p>
          </div>

          <div className="grid3">
            <div className="card reveal">
              <div className="ic" style={{ background: 'var(--purple)' }} aria-hidden="true">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h10M4 18h6" />
                </svg>
              </div>
              <h3>Only the numbers that matter</h3>
              <p>
                Your ledger stays on your phone. When you ask a question, the app works out which
                entries, budgets and balances bear on it and sends <b>only those</b> — not your whole
                financial history.
              </p>
            </div>

            <div className="card reveal">
              <div className="ic" style={{ background: 'var(--blue)' }} aria-hidden="true">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
                </svg>
              </div>
              <h3>An answer, not an essay</h3>
              <p>
                The reply leads with the single thing worth changing, compares this month with last,
                and names the category. <b>A number and a next step</b>, in the length of a text
                message.
              </p>
            </div>

            <div className="card reveal">
              <div className="ic" style={{ background: 'var(--green-dk)' }} aria-hidden="true">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.5l7.5 3v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6z" />
                </svg>
              </div>
              <h3>Nothing leaves until you ask</h3>
              <p>
                There is no account, no bank linking and no copy of your budget on a server. The only
                thing that ever goes out is <b>the question you typed</b>, at the moment you send it.
              </p>
            </div>
          </div>

          <div className="reveal" style={{ textAlign: 'center', marginTop: 56 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>Want this in your own product?</h2>
            <p className="lede" style={{ margin: '14px auto 0', textAlign: 'center' }}>
              I have shipped this twice now: the coach in this app, and Ruta AI inside a
              service-management platform used by real businesses — where it answers from company
              records and takes actions with a person confirming.
            </p>
            <div className="cta-row" style={{ marginTop: 26 }}>
              <Link href="/ruta" className="btn">See the AI work in Ruta</Link>
              <a href="mailto:thomas@kingdom-sites.com" className="btn ghost">Talk to me about it</a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL ============ */}
      <div className="final band" id="get">
        <div className="wrap reveal">
          <h2>Two taps. Then get on with your day.</h2>
          <p className="sub">An easy way to log and track transactions — including cash.</p>
          <div className="cta-row">
            <AppStoreButton />
          </div>
          <p className="note">Free on the App Store. Requires iPhone with iOS 17 or later — Apple Watch app and lock-screen widgets included.</p>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <span>Tap to Tick · {new Date().getFullYear()} Thomas Klein</span>
          <span>
            <Link href="/tap-to-tick/privacy">Privacy Policy</Link>
            {' · '}
            <a href="mailto:thomas@kingdom-sites.com">Support</a>
            {' · '}
            <Link href="/my-work">Built by Kingdom Sites</Link>
          </span>
        </div>
      </footer>
    </>
  )
}
