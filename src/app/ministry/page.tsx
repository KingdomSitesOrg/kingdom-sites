import type { Metadata } from 'next'
import Link from 'next/link'
import { Noto_Sans_Bengali } from 'next/font/google'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'
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
    <div className="w-full overflow-x-hidden">
      {/* Hero */}
      <section className="hero-wash px-5 pb-14 pt-16 text-center sm:px-8 sm:pb-16 sm:pt-24">
        <p className="eyebrow">Ministry</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
          A book of the Bible in four minutes — in English and{' '}
          <span className={`text-accent ${notoBengali.className}`}>বাংলা</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-body sm:text-lg">
          Hand-drawn walkthroughs that take a whole letter and put it on one page — who wrote it, what
          it says, and how the parts fit together. Made for people meeting the book for the first time,
          in the language they actually think in.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted">
          Free to watch, free to download, free to show to anyone.
        </p>
      </section>

      {/* The player */}
      <section aria-label="Ephesians" className="band-dark px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="eyebrow">Overview · Ephesians</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ephesians
          </h2>
          <p className="mt-2 text-base text-white/80">A letter from prison.</p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
            Pick a language below. Both versions are the same walkthrough — same drawings, same order —
            narrated and lettered in English or Bangla.
          </p>

          <div className="mt-8">
            <MinistryPlayer videos={EPHESIANS} bengaliFontClass={notoBengali.className} />
          </div>
        </div>
      </section>

      {/* What's in it */}
      <section aria-label="What the video covers" className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            What the video covers
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {OUTLINE.map((item) => (
              <div key={item.heading} className="tile p-7">
                <h3 className="text-base font-semibold tracking-tight text-ink">{item.heading}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Bangla */}
      <section aria-label="Why these languages" className="border-t border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="tile p-7 sm:p-10">
            <p className="eyebrow eyebrow-blue">Why Bangla</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Roughly 240 million people speak it — and very little of this exists for them.
            </h2>
            <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-body sm:text-base">
              Short, visual overviews of Scripture are easy to find in English and scarce in most of
              South Asia. Making them in Bangla costs almost nothing once the English version exists,
              and a four-minute video travels further than a book — it can be watched on a phone,
              downloaded, and passed on with no internet at all.
            </p>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-body sm:text-base">
              More books are on the way. If a translation into another language would be useful where
              you are, tell me which one.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Link href="/mission" className="btn-primary">Read about the mission</Link>
              <a href={CONTACT_MAILTO} className="text-sm text-body underline underline-offset-4 hover:text-ink">
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
