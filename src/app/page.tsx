import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import EditorialChrome from '@/components/editorial/Chrome'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { AUDIENCES, OFFER, PROJECTS, SHOTS, STEPS, type Shot } from '@/lib/work'

export const metadata: Metadata = {
  title: 'Kingdom Sites — websites and apps for churches, schools and small businesses',
  description:
    'A small studio that designs, builds and looks after websites and iPhone and Android apps. Farzana, JAM Classes, Jam with Latin and more.',
  alternates: { canonical: '/' },
}

/* The screens are already sized for the page, so they are served as they are. */
function Pic({ shot, className, priority }: { shot: Shot; className: string; priority?: boolean }) {
  return (
    <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} className={className} priority={priority} unoptimized />
  )
}

function Meta({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="ed-meta">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

const byslug = Object.fromEntries(PROJECTS.map((p) => [p.slug, p]))
const CONTENTS = [
  { n: '01', name: 'Farzana', href: '#w-farzana', shot: SHOTS.farzanaStudentsPhone, phone: true },
  { n: '02', name: 'JAM Classes', href: '#w-jam', shot: SHOTS.jamClassPhone, phone: true },
  { n: '03', name: 'Jam with Latin', href: '#w-latin', shot: SHOTS.latinMap, phone: true },
]

const OTHERS = ['ruta', 'delta', 'kcupg', 'prayer'].map((s) => byslug[s])

export default function Home() {
  return (
    <EditorialChrome>
      {/* Opening: the sentence is the hero. */}
      <section aria-label="Kingdom Sites" className="ed-wrap pb-16 pt-14 sm:pb-24 sm:pt-20">
        <p className="ed-mono ed-soft ed-rise">Websites · iPhone and Android apps · The software behind them</p>
        <h1 className="ed-serif ed-h1 ed-rise ed-rise-2 mt-6 max-w-[19ch]">
          Websites and apps for churches, schools <em>and the people who run them.</em>
        </h1>
        <div className="ed-grid ed-rise ed-rise-3 mt-12 items-start sm:mt-14">
          <div className="ed-c1-4">
            <p className="ed-lede">
              Kingdom Sites is a small studio. Thomas Klein designs and builds every project himself, and stays to look
              after it once it is live.
            </p>
            <div className="mt-7 flex flex-col items-start gap-3">
              <Link href={INQUIRE_PATH} className="ed-btn">
                {INQUIRE_CTA} <span className="ed-arrow" aria-hidden="true">→</span>
              </Link>
              <a href={CONTACT_MAILTO} className="ed-link ed-soft text-sm">
                or write to {CONTACT_EMAIL}
              </a>
            </div>
          </div>
          {/* Contents: the real work, above the fold, as a printed index would list it. */}
          <ul className="ed-c6-13 mt-12 grid w-full grid-cols-3 items-end gap-3 md:mt-0 md:-mt-24 md:max-w-[460px] md:justify-self-end md:gap-5" aria-label="Selected work">
            {CONTENTS.map((c) => (
              <li key={c.href}>
                <a href={c.href} className="group block">
                  <span className="block overflow-hidden">
                    <Pic shot={c.shot} className={`${c.phone ? 'ed-phone' : 'ed-shot'} transition-transform duration-500 group-hover:scale-[1.02]`} priority />
                  </span>
                  <span className="ed-mono mt-3 block">
                    <span className="ed-num">{c.n}</span> {c.name}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 01 Farzana: the screen, big, with the facts beside it. */}
      <section aria-labelledby="w-farzana" className="ed-wrap">
        <div className="ed-rule ed-grid pt-5">
          <p className="ed-mono ed-c1-3">
            <span className="ed-num">01</span> &nbsp;Selected work
          </p>
          <h2 id="w-farzana" className="ed-serif ed-h2 ed-c4-13 mt-3 md:mt-0">Farzana</h2>
        </div>
        <div className="ed-grid mt-8">
          <div className="ed-c1-3 order-2 mt-6 md:order-none md:mt-0">
            <Meta
              rows={[
                ['For', byslug.farzana.forWhom],
                ['Made', 'Platform, site, brand'],
                ['Runs on', byslug.farzana.platforms],
                ['Status', byslug.farzana.status],
              ]}
            />
            <p className="mt-6 text-[15px]">{byslug.farzana.line}</p>
            <a href="https://farzana.app" className="ed-link mt-4 inline-block text-[15px]">
              farzana.app <span aria-hidden="true">↗</span>
            </a>
          </div>
          <figure className="ed-c4-13">
            <Pic shot={SHOTS.farzanaSite} className="ed-shot" priority />
            <figcaption className="ed-cap">The front door at farzana.app. One sentence, one button, no price list.</figcaption>
          </figure>
        </div>
      </section>

      {/* 02 JAM Classes: the school the platform was built with. */}
      <section aria-labelledby="w-jam" className="ed-wrap mt-24 sm:mt-36">
        <div className="ed-rule ed-grid pt-5">
          <p className="ed-mono ed-c1-3">
            <span className="ed-num">02</span>
          </p>
          <h2 id="w-jam" className="ed-serif ed-h2 ed-c4-13 mt-3 md:mt-0">JAM Classes</h2>
        </div>
        <div className="ed-grid mt-8 items-start">
          <figure className="ed-c1-8">
            <Pic shot={SHOTS.jamAdminHome} className="ed-shot" />
            <figcaption className="ed-cap">What the teacher sees first: students, who was active this week, sales, and the classes.</figcaption>
          </figure>
          <figure className="ed-c9-13 mt-10 md:mt-24">
            <div className="mx-auto max-w-[300px] md:max-w-none">
              <Pic shot={SHOTS.jamClassPhone} className="ed-phone" />
            </div>
            <figcaption className="ed-cap">A class page on a parent’s phone. Free to start, with a sample to try first.</figcaption>
          </figure>
        </div>
        <div className="ed-grid mt-10">
          <div className="ed-c4-13 grid gap-8 md:grid-cols-2">
            <p className="ed-serif text-[1.45rem] leading-snug tracking-tight">{byslug['jam-classes'].line}</p>
            <Meta
              rows={[
                ['For', byslug['jam-classes'].forWhom],
                ['Made', 'Classes, shop, sign-up, payments'],
                ['Runs on', byslug['jam-classes'].platforms],
                ['Status', byslug['jam-classes'].status],
              ]}
            />
          </div>
        </div>
      </section>

      {/* 03 Jam with Latin: four real phone screens in a row. */}
      <section aria-labelledby="w-latin" className="ed-wrap mt-24 sm:mt-36">
        <div className="ed-rule ed-grid pt-5">
          <p className="ed-mono ed-c1-3">
            <span className="ed-num">03</span>
          </p>
          <h2 id="w-latin" className="ed-serif ed-h2 ed-c4-13 mt-3 md:mt-0">Jam with Latin</h2>
        </div>
        <div className="ed-grid mt-8">
          <p className="ed-c1-3 text-[15px]">
            {byslug['jam-with-latin'].line}
            <Link href="/latin-game" className="ed-link mt-4 block w-fit">
              {byslug['jam-with-latin'].status} <span aria-hidden="true">→</span>
            </Link>
          </p>
          <ul className="ed-c4-13 mt-8 grid grid-cols-2 gap-4 md:mt-0 md:grid-cols-4 md:gap-6">
            {[
              [SHOTS.latinHome, 'Home'],
              [SHOTS.latinMap, 'The journey'],
              [SHOTS.latinCase, 'A case challenge'],
              [SHOTS.latinBoard, 'The leaderboard'],
            ].map(([shot, label]) => (
              <li key={label as string}>
                <Pic shot={shot as Shot} className="ed-phone" />
                <p className="ed-cap">{label as string}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Also: the rest, as an index. */}
      <section aria-labelledby="w-also" className="ed-wrap mt-24 sm:mt-36">
        <div className="ed-rule ed-grid pt-5">
          <p className="ed-mono ed-c1-3">
            <span className="ed-num">04</span>
          </p>
          <h2 id="w-also" className="ed-serif ed-h2 ed-c4-13 mt-3 md:mt-0">Also</h2>
        </div>
        <div className="mt-8">
          {[byslug['tap-to-tick'], ...OTHERS].map((p) => (
            <a key={p.slug} href={p.href} className="ed-index-row">
              <span className="ed-serif text-[1.7rem] leading-tight tracking-tight">{p.name}</span>
              <span className="ed-mono ed-soft">{p.forWhom}</span>
              <span className="text-[15px]">{p.line}</span>
              <span className="text-[15px] md:text-right">
                {p.status} <span className="ed-arrow" aria-hidden="true">↗</span>
              </span>
            </a>
          ))}
          <div className="ed-hair pt-6">
            <Link href="/work" className="ed-link">
              Everything, with what we did on each <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* What we make, and for whom. */}
      <section aria-labelledby="make" className="ed-wrap mt-24 sm:mt-36">
        <div className="ed-rule ed-grid pt-5">
          <p className="ed-mono ed-c1-3">
            <span className="ed-num">05</span>
          </p>
          <h2 id="make" className="ed-serif ed-h2 ed-c4-13 mt-3 max-w-[18ch] md:mt-0">
            What we make, and who we make it for.
          </h2>
        </div>
        <div className="ed-grid mt-12">
          <div className="ed-c4-13 grid gap-x-8 gap-y-10 md:grid-cols-3">
            {OFFER.map((o) => (
              <div key={o.title} className="ed-hair pt-4">
                <h3 className="ed-serif ed-h3">{o.title}</h3>
                <p className="ed-soft mt-3 text-[15px]">{o.body}</p>
              </div>
            ))}
            {AUDIENCES.map((a) => (
              <div key={a.title} className="ed-hair pt-4">
                <p className="ed-mono ed-num">For</p>
                <h3 className="ed-serif ed-h3 mt-1">{a.title}</h3>
                <p className="ed-soft mt-3 text-[15px]">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it starts. */}
      <section aria-labelledby="steps" className="ed-wrap mt-24 sm:mt-36">
        <h2 id="steps" className="ed-mono">
          <span className="ed-num">06</span> &nbsp;How it starts
        </h2>
        <ol className="ed-steps mt-5">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="ed-serif ed-step-n ed-num" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="ed-serif mt-4 text-[1.5rem] leading-tight tracking-tight">{s.title}</h3>
              <p className="ed-soft mt-2 max-w-[32ch] text-[15px]">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Close. */}
      <section aria-label="Start a conversation" className="ed-wrap pb-20 pt-24 sm:pb-28 sm:pt-36">
        <p className="ed-serif ed-h1 max-w-[13ch]">
          Tell us what you <em>have in mind.</em>
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href={INQUIRE_PATH} className="ed-btn">
            {INQUIRE_CTA} <span className="ed-arrow" aria-hidden="true">→</span>
          </Link>
          <p className="ed-soft text-[15px]">Every note is read and answered by Thomas.</p>
        </div>
      </section>
    </EditorialChrome>
  )
}
