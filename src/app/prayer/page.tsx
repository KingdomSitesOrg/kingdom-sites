import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PrayerNav from './PrayerNav'

export const metadata: Metadata = {
  title: 'Prayer — Romans 10:14 prayer meetings for the unreached',
  description:
    'A simple prayer-meeting initiative for the unreached world. Weekly guides, leader materials, and tools so anyone can start praying with a group.',
  alternates: { canonical: '/prayer' },
  openGraph: {
    title: 'Prayer — Kingdom Sites',
    description:
      'Romans 10:14 prayer meetings for the unreached. Guides, leader materials, and tools to start praying with a group.',
    url: 'https://kingdom-sites.com/prayer',
    siteName: 'Kingdom Sites',
    type: 'website',
    images: [{ url: '/prayer/globe.jpg', width: 1600, height: 1067 }],
  },
}

const PRAYER_EMAIL = 'romtenfourteen@icloud.com'
const PRAYER_MAILTO = `mailto:${PRAYER_EMAIL}`
const JOSHUA_URL = 'https://unreachedoftheday.org'
const STRATUS_URL = 'https://stratus.earth'

/* Same organizations as the mission page — people to pray with and give to. */
const ORGS = [
  { name: 'Voice of the Martyrs', url: 'https://www.persecution.com' },
  { name: 'Open Doors', url: 'https://www.opendoors.org' },
  { name: 'International Christian Concern', url: 'https://www.persecution.org' },
  { name: 'RUN Ministries', url: 'https://runministries.org' },
  { name: 'No Place Left', url: 'https://noplaceleft.net' },
  { name: 'Operation Mobilization', url: 'https://www.om.org' },
  { name: 'GFA World', url: 'https://www.gfa.org' },
  { name: 'International Mission Board', url: 'https://www.imb.org' },
]

/* Keep this list even (2 / 4 / 6) for the multi-column grid — see /squareup skill. */
const GUIDE_PARTS = [
  {
    num: '01',
    heading: 'Bible verse',
    body: 'A short passage to anchor the night. Ask simple questions — what does this mean for us, why did Jesus say this, how does it land today.',
  },
  {
    num: '02',
    heading: 'Story',
    body: 'A real story from the field — missionaries, local believers, or people groups most of us never hear about — so prayer has a face.',
  },
  {
    num: '03',
    heading: 'Missionary quote',
    body: 'A short, convicting line from someone who actually went. Useful when the room needs a jolt of courage.',
  },
  {
    num: '04',
    heading: 'Stunning facts',
    body: 'Eye-opening numbers about unreached nations, the 10/40 window, and the hard realities of a fallen world.',
  },
  {
    num: '05',
    heading: 'Praise report',
    body: 'One place God is already moving — growth, open doors, answered prayer — so the meeting is not only heavy.',
  },
  {
    num: '06',
    heading: 'Prayer points and action',
    body: 'Specific asks for the night: a country, a people group, a church under pressure, our own boldness at home — plus one or two practical next steps so the night leaves the room.',
  },
]

const TERMS = [
  {
    heading: 'Unreached',
    body: 'A people group with little or no access to the gospel — few believers, no churches of their own, and almost no one telling them about Jesus in a language and culture they understand.',
  },
  {
    heading: 'The 10/40 window',
    body: 'The band of the world from roughly 10° to 40° north latitude across North Africa, the Middle East, and Asia — where most unreached peoples live, and where Christian presence is thinnest.',
  },
  {
    heading: 'Why we care',
    body: 'Romans 10:14 asks a hard question: how will they believe if they never hear? Prayer is not the whole answer — but it is the place most of us can start, and the place the work still needs most.',
  },
]

const MATERIALS = [
  {
    title: 'Fire in Secret',
    focus: 'Iran · underground church',
    blurb:
      'John 1:5, the house church that multiplies under pressure, and prayer for Muslim-background believers. Includes a stylized map, Persian people-group snapshot, and sources.',
    href: '/prayer/materials/iran-fire-in-secret.pdf',
  },
  {
    title: 'Bad Medicine — Great God',
    focus: 'Yemen · transformation',
    blurb:
      'A missionary family, a medical disaster, and a night of prayer that grew a boy four inches. Prayer points for Yemen, India, Afghanistan, and the church under pressure.',
    href: '/prayer/materials/bad-medicine-great-god.pdf',
  },
  {
    title: 'Persecution — Perseverance',
    focus: 'North Korea · standing firm',
    blurb:
      'Matthew 5:11–12, the church in North Korea, and what boldness looks like where religious freedom is still a privilege. Includes a people-group snapshot and action items.',
    href: '/prayer/materials/persecution-perseverance.pdf',
  },
  {
    title: 'Leader guide',
    focus: 'How to run a night',
    blurb:
      'The short brief for anyone starting a group: what each weekly guide includes, how to prepare, and the few terms every leader should know.',
    href: '/prayer/materials/leader-guide.pdf',
  },
]

const TOOLS = [
  {
    title: 'Unreached of the day',
    blurb: 'Joshua Project’s daily people group — one group, one day, ready to pray for right now.',
    href: JOSHUA_URL,
  },
  {
    title: 'Stratus',
    blurb: 'A global map of gospel need by country. Useful for meetings, Bible studies, and personal prayer.',
    href: STRATUS_URL,
  },
]

export default function Prayer() {
  return (
    <>
      <PrayerNav />

      {/* ---------- opening ---------- */}
      <div className="hero">
        <div className="wrap narrow">
          <p className="kicker">Romans 10:14 · Prayer initiative</p>
          <h1 style={{ marginTop: 16 }}>
            Pray for the people who still have no one telling them.
          </h1>
          <p className="lede" style={{ marginTop: 18 }}>
            A simple weekly prayer-meeting kit for the unreached world — a verse, a story, a few
            facts, and clear prayer points. Free to use, flexible to lead, built so anyone can start
            a group.
          </p>
          <div className="actions" style={{ marginTop: 28 }}>
            <a href="#materials" className="btn">See the materials</a>
            <a href="#lead" className="btn-quiet">Lead a meeting</a>
          </div>
        </div>
      </div>

      {/* ---------- the verse ---------- */}
      <section aria-label="Romans 10:14" className="band-night">
        <div className="wrap narrow center">
          <p className="kicker">The verse</p>
          <blockquote className="verse" style={{ marginTop: 18, color: '#fffcf7' }}>
            “How then will they call on him in whom they have not believed? And how are they to
            believe in him of whom they have never heard? And how are they to hear without someone
            preaching?”
            <cite>Romans 10:14</cite>
          </blockquote>
          <p style={{ marginTop: 22, fontSize: 15.5, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            That question is the whole initiative. Most of the world still has almost no access to
            the gospel. Prayer is where ordinary believers get on the field.
          </p>
        </div>
      </section>

      {/* ---------- what this is ---------- */}
      <section id="meetings" aria-label="What this is">
        <div className="wrap">
          <div className="narrow">
            <p className="kicker">What this is</p>
            <h2 style={{ marginTop: 12 }}>A prayer meeting you can actually run.</h2>
            <p className="lede" style={{ marginTop: 16 }}>
              God put a strong desire on one person’s heart to start praying for unreached nations —
              not once a year, but week by week, with a group. After trying a few approaches, a
              simple weekly guide stuck. This site is that guide, shared so other people can start
              the same kind of night where they are.
            </p>
            <p className="quiet" style={{ marginTop: 14 }}>
              It is not a rigid curriculum. It is a flexible scaffold: enough structure that nobody
              freezes, enough room that the Holy Spirit still leads.
            </p>
          </div>

          <div className="grid2" style={{ marginTop: 32 }}>
            {GUIDE_PARTS.map((part) => (
              <div key={part.num} className="card">
                <span className="num">{part.num}</span>
                <h3>{part.heading}</h3>
                <p>{part.body}</p>
              </div>
            ))}
          </div>

          <div className="grid3" style={{ marginTop: 28 }}>
            {TERMS.map((t) => (
              <div key={t.heading} className="term">
                <h3>{t.heading}</h3>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- materials ---------- */}
      <section id="materials" aria-label="Weekly materials" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="narrow">
            <p className="kicker">Weekly materials</p>
            <h2 style={{ marginTop: 12 }}>Sample guides you can download tonight.</h2>
            <p className="lede" style={{ marginTop: 14 }}>
              Each PDF is a full meeting: verse, story, quote, facts, praise, prayer points, and
              one or two action items. Print them, share them, or just open them on a phone in the
              circle.
            </p>
          </div>

          {/* 4 materials → 2×2; grid3 would leave an orphan. See /squareup. */}
          <div className="grid2" style={{ marginTop: 28 }}>
            {MATERIALS.map((m) => (
              <a key={m.title} href={m.href} className="tile" target="_blank" rel="noopener">
                <p className="kicker" style={{ margin: 0 }}>{m.focus}</p>
                <h3>{m.title}</h3>
                <p>{m.blurb}</p>
                <span className="go">Download PDF →</span>
              </a>
            ))}
          </div>

          {/* Featured sample: walk through one guide on the page */}
          <div className="guide" style={{ marginTop: 40 }}>
            <div className="guide-head">
              <p className="kicker">Sample night · Yemen</p>
              <h2 style={{ marginTop: 10 }}>Bad Medicine — Great God</h2>
              <p className="quiet" style={{ marginTop: 8, maxWidth: 560 }}>
                A full walkthrough of one weekly guide, so you can see the shape before you download.
              </p>
            </div>
            <div className="guide-body">
              <div className="guide-row">
                <span className="guide-label">Verse</span>
                <p>
                  “Look, the Lamb of God, who takes away the sin of the world!” — John 1:29
                </p>
              </div>
              <div className="guide-row">
                <span className="guide-label">Story</span>
                <p>
                  Around 2000, a missionary family in Yemen was building wells and sharing the
                  gospel. When their son got sick, undertrained doctors gave him the wrong medicine
                  and stunted his growth. One night his parents laid hands on him and prayed — and
                  by morning he had grown roughly four inches back toward normal height. A quiet
                  reminder that God still takes care of His children in the hardest places. (From{' '}
                  <em>Sunrise in the Valley of the Shadow of Death</em> by Amira Ann.)
                </p>
              </div>
              <div className="guide-row">
                <span className="guide-label">Quote</span>
                <p>
                  “I was called not to comfort or success but to obedience… There is no joy outside
                  of knowing Jesus and serving him.” — Karen Watson
                </p>
              </div>
              <div className="guide-row">
                <span className="guide-label">Facts</span>
                <p>
                  Nine years of civil war have gutted Yemen’s health system. A child dies every ten
                  minutes from starvation or easily treatable disease. A woman dies in childbirth
                  every two hours. Almost none of them have ever heard an authentic gospel message.
                </p>
              </div>
              <div className="guide-row">
                <span className="guide-label">Praise</span>
                <p>
                  Even under severe persecution, the church in Yemen is growing — about 5.1% a year,
                  compared with roughly 2.6% for the rest of the world.
                </p>
              </div>
              <div className="guide-row">
                <span className="guide-label">Pray for</span>
                <p>
                  Yemen’s persecuted church and humanitarian crisis · India (largest unreached
                  population) · Afghanistan · Christian leaders and revival in the West · wars that
                  leave whole regions without a clear gospel witness.
                </p>
              </div>
              <div className="guide-row">
                <span className="guide-label">Do this</span>
                <p>
                  Pray for Yemen every day this week. Share one fact about Yemen with another
                  Christian who has never heard it, and ask them to pray too.
                </p>
              </div>
            </div>
            <div className="guide-foot">
              <a
                href="/prayer/materials/bad-medicine-great-god.pdf"
                className="btn"
                target="_blank"
                rel="noopener"
              >
                Download this guide
              </a>
              <a
                href="/prayer/materials/persecution-perseverance.pdf"
                className="btn-quiet"
                target="_blank"
                rel="noopener"
              >
                North Korea guide
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- lead ---------- */}
      <section id="lead" aria-label="Lead a meeting" className="band-night">
        <div className="wrap">
          <div className="narrow">
            <p className="kicker">Lead a meeting</p>
            <h2 style={{ marginTop: 12 }}>You do not need a seminary degree. You need a room and a guide.</h2>
            <div className="stack" style={{ marginTop: 20, fontSize: 15.5 }}>
              <p>
                Spend a few minutes in prayer before people arrive. Skim the week’s PDF. Add
                anything the Spirit puts on your heart. Then let conversation and prayer move
                naturally — the guide is a help, not a script to finish for its own sake.
              </p>
              <p>
                The aim is simple: encourage one another toward love and good works, grow in Jesus
                for our joy and His glory, and keep the unreached on the church’s lips.
              </p>
            </div>
            <div className="actions left" style={{ marginTop: 28 }}>
              <a
                href="/prayer/materials/leader-guide.pdf"
                className="btn-night"
                target="_blank"
                rel="noopener"
              >
                Download the leader guide
              </a>
              <a href={PRAYER_MAILTO} className="btn-quiet" style={{ color: '#fffcf7', borderColor: 'rgba(255,252,247,0.28)' }}>
                Email {PRAYER_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- pray now ---------- */}
      <section id="pray" aria-label="Pray now">
        <div className="wrap">
          <div className="narrow">
            <p className="kicker">Pray now</p>
            <h2 style={{ marginTop: 12 }}>One people group. Today.</h2>
            <p className="lede" style={{ marginTop: 14 }}>
              “We can reach our world, if we will. The greatest lack today is not people or funds.
              The greatest need is prayer.” — Wesley Duewel
            </p>
            <p className="quiet" style={{ marginTop: 12 }}>
              Joshua Project publishes a different unreached people group every day — population,
              language, religion, and how to pray. Open it when you have two minutes.
            </p>
            <div className="actions left" style={{ marginTop: 24 }}>
              <a href={JOSHUA_URL} className="btn" target="_blank" rel="noopener noreferrer">
                Unreached of the day ↗
              </a>
            </div>
          </div>

          <div className="card split-card" style={{ marginTop: 36 }}>
            <div className="split-copy">
              <p className="kicker">Why it matters</p>
              <h3 style={{ marginTop: 10, fontSize: 22 }}>
                Most of the church prays for what it already sees.
              </h3>
              <p style={{ marginTop: 12 }}>
                The unreached almost never make the prayer list because almost nobody knows their
                names. A weekly meeting — and one daily people group — is a small way to fix that.
              </p>
            </div>
            <div className="split-photo">
              <Image
                src="/prayer/field.jpg"
                alt="Open fields under a wide sky"
                fill
                sizes="(max-width: 700px) 100vw, 420px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- tools ---------- */}
      <section id="tools" aria-label="Tools and next steps" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="narrow">
            <p className="kicker">Tools</p>
            <h2 style={{ marginTop: 12 }}>Keep the night going after you close in prayer.</h2>
          </div>

          <div className="grid2" style={{ marginTop: 28 }}>
            {TOOLS.map((t) => (
              <a
                key={t.title}
                href={t.href}
                className="tile"
                target="_blank"
                rel="noopener noreferrer"
              >
                <h3>{t.title}</h3>
                <p>{t.blurb}</p>
                <span className="go">Open ↗</span>
              </a>
            ))}
          </div>

          <div className="narrow" style={{ marginTop: 48 }}>
            <p className="kicker">Give & stand with</p>
            <h2 style={{ marginTop: 12 }}>Organizations worth knowing — and giving to.</h2>
            <p className="quiet" style={{ marginTop: 12 }}>
              The same list as on the Kingdom Sites mission page. Some work alongside the
              persecuted church; others train, send, and plant. Naming them is not a claim of
              partnership either way — the work is worth supporting.
            </p>
          </div>

          <ul
            className="grid2"
            style={{ marginTop: 28, listStyle: 'none', padding: 0, marginBottom: 0 }}
          >
            {ORGS.map((org) => (
              <li key={org.name}>
                <a
                  href={org.url}
                  className="tile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <h3>{org.name}</h3>
                  <span className="go">Visit and give ↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- contact ---------- */}
      <section aria-label="Contact" style={{ paddingTop: 12, paddingBottom: 72 }}>
        <div className="wrap">
          <div
            className="card"
            style={{
              padding: '34px 28px 36px',
              textAlign: 'center',
              background:
                'linear-gradient(160deg, #fff9f1 0%, var(--card) 55%, #f3ebe0 100%)',
            }}
          >
            <p className="kicker">Get in touch</p>
            <h2 style={{ marginTop: 12 }}>Starting a group? Stuck on a week? Write.</h2>
            <p className="quiet" style={{ marginTop: 12, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Questions about leading, materials, or collaborating land at the same inbox that
              started this whole thing.
            </p>
            <div className="actions" style={{ marginTop: 24 }}>
              <a href={PRAYER_MAILTO} className="btn">Email {PRAYER_EMAIL}</a>
              <Link href="/mission" className="btn-quiet">Kingdom Sites mission</Link>
            </div>
            <p className="quiet" style={{ marginTop: 22, fontSize: 13.5 }}>
              “The Gospel is only good news if it gets there on time.” — Carl F. H. Henry
            </p>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span>Kingdom Sites · Prayer · Romans 10:14 · {new Date().getFullYear()}</span>
          <span>
            <Link href="/">Back to Kingdom Sites</Link>
          </span>
        </div>
      </footer>
    </>
  )
}
