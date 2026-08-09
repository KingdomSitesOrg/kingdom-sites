import type { Metadata } from 'next'
import Link from 'next/link'
import { Noto_Sans_Bengali } from 'next/font/google'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import MinistryNav from './MinistryNav'
import MinistryPlayer, { type MinistryVideo } from './MinistryPlayer'

// Inter has no Bengali letters, so Bangla text would fall back to whatever the
// visitor's device happens to have. This ships the script with the page.
const notoBengali = Noto_Sans_Bengali({ subsets: ['bengali'], weight: ['400', '600'] })

export const metadata: Metadata = {
  title: 'Ministry — Bible overview videos in English and Bangla',
  description:
    'Short, hand-drawn walkthroughs of books of the Bible, in English and Bangla (বাংলা). Free to watch, download, and share.',
  alternates: { canonical: '/ministry' },
  openGraph: {
    title: 'Ministry — Kingdom Sites',
    description:
      'Short, hand-drawn walkthroughs of books of the Bible, in English and Bangla. Free to watch, download, and share.',
    url: 'https://kingdom-sites.com/ministry',
    siteName: 'Kingdom Sites',
    type: 'website',
    images: [{ url: '/ministry/ephesians-en.jpg', width: 1920, height: 1080 }],
  },
}

const EPHESIANS: MinistryVideo[] = [
  {
    code: 'en',
    nativeLabel: 'English',
    englishLabel: 'English',
    title: 'Ephesians',
    subtitle: 'A Letter from Prison',
    src: '/ministry/ephesians-en.mp4',
    poster: '/ministry/ephesians-en.jpg',
    length: '3 min 44 sec',
  },
  {
    code: 'bn',
    nativeLabel: 'বাংলা',
    englishLabel: 'Bangla',
    title: 'ইফিষীয়',
    subtitle: 'কারাগার থেকে লেখা এক চিঠি',
    src: '/ministry/ephesians-bn.mp4',
    poster: '/ministry/ephesians-bn.jpg',
    length: '4 min 19 sec',
  },
]

const OUTLINE = [
  {
    heading: 'Written from a prison cell',
    body: 'Paul writes to the church in Ephesus while under guard in Rome. Nothing about his circumstances is hidden, and nothing about them dampens the letter.',
  },
  {
    heading: 'Chapters 1–3 — what God has done',
    body: 'Chosen, rescued, and raised with Christ. The first half of the letter is one long look at a gift already given, not a list of things to earn.',
  },
  {
    heading: 'One new people',
    body: 'The wall between Jew and Gentile comes down. Two groups who had every reason to stay apart are made into a single household.',
  },
  {
    heading: 'Chapters 4–6 — how to walk',
    body: 'Believe it, then live like it: unity, honest speech, changed homes and workplaces, and armour for a fight that was never really against people.',
  },
]

export default function Ministry() {
  return (
    <>
      <MinistryNav />

      {/* ---------- opening ---------- */}
      <div className="hero">
        <div className="wrap narrow">
          <p className="kicker">Ministry</p>
          <h1 style={{ marginTop: 18 }}>
            A book of the Bible in four minutes — in English and{' '}
            <span className={`oxblood ${notoBengali.className}`}>বাংলা</span>.
          </h1>
          <p className="lede" style={{ marginTop: 22 }}>
            Hand-drawn walkthroughs that take a whole letter and put it on one page — who wrote it,
            what it says, and how the parts fit together. Made for people meeting the book for the
            first time, in the language they actually think in.
          </p>
          <p className="quiet" style={{ marginTop: 14 }}>
            Free to watch, free to download, free to show to anyone.
          </p>
          <div className="rule" style={{ marginTop: 36 }}>
            <span>✦</span>
          </div>
        </div>
      </div>

      {/* ---------- the video, on a dark plate ---------- */}
      <section id="ephesians" className="plate">
        <div className="wrap">
          <p className="kicker">Overview · Ephesians</p>
          <h2 style={{ marginTop: 14 }}>Ephesians</h2>
          <p style={{ marginTop: 10, fontSize: 18.5 }}>A letter from prison.</p>
          <p style={{ marginTop: 16, maxWidth: 640, fontSize: 16 }}>
            Pick a language below. Both versions are the same walkthrough — same drawings, same order
            — narrated and lettered in English or Bangla.
          </p>

          <div style={{ marginTop: 30 }}>
            <MinistryPlayer videos={EPHESIANS} bengaliFontClass={notoBengali.className} />
          </div>
        </div>
      </section>

      {/* ---------- what it covers ---------- */}
      <section id="covers">
        <div className="wrap">
          <h2>What the video covers</h2>
          <div className="grid2" style={{ marginTop: 28 }}>
            {OUTLINE.map((item) => (
              <div key={item.heading} className="card">
                <h3>{item.heading}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- why Bangla ---------- */}
      <section id="bangla" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="card" style={{ padding: '34px 34px 38px' }}>
            <p className="kicker">Why Bangla</p>
            <h2 style={{ marginTop: 12 }}>
              Roughly 240 million people speak it — and very little of this exists for them.
            </h2>
            <p style={{ marginTop: 20, maxWidth: 720, fontSize: 16.5 }}>
              Short, visual overviews of Scripture are easy to find in English and scarce almost
              everywhere else. Making them in Bangla costs almost nothing once the English version exists,
              and a four-minute video travels further than a book — it can be watched on a phone,
              downloaded, and passed on with no internet at all.
            </p>
            <p style={{ marginTop: 14, maxWidth: 720, fontSize: 16.5 }}>
              More books are on the way. If a translation into another language would be useful where
              you are, tell me which one.
            </p>
            <div
              style={{
                marginTop: 28,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <Link href="/mission" className="btn">Read about the mission</Link>
              <Link href={INQUIRE_PATH} className="inline-link" style={{ fontSize: 15 }}>
                {INQUIRE_CTA}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span>Kingdom Sites · Ministry · {new Date().getFullYear()}</span>
          <span>
            <Link href="/">Back to Kingdom Sites</Link>
          </span>
        </div>
      </footer>
    </>
  )
}
