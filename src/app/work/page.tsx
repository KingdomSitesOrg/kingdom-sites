import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import EditorialChrome from '@/components/editorial/Chrome'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { PROJECTS, SHOTS, type Shot } from '@/lib/work'

export const metadata: Metadata = {
  title: 'Work',
  description: 'Everything Kingdom Sites has designed and built: Farzana, JAM Classes, Jam with Latin, Tap to Tick, Ruta and more.',
  alternates: { canonical: '/work' },
}

/* One picture per project where there is a real screen to show. */
const COVER: Record<string, Shot | undefined> = {
  farzana: SHOTS.farzanaStudents,
  'jam-classes': SHOTS.jamClass,
  'jam-with-latin': SHOTS.latinMap,
  'tap-to-tick': SHOTS.tapOverview,
}

export default function Work() {
  return (
    <EditorialChrome here="/work">
      <section aria-label="Work" className="ed-wrap pb-10 pt-14 sm:pt-20">
        <p className="ed-mono ed-soft">Index · {PROJECTS.length} projects</p>
        <h1 className="ed-serif ed-h1 mt-6 max-w-[12ch]">
          Everything, <em>and what we did on it.</em>
        </h1>
      </section>

      <ol className="ed-wrap">
        {PROJECTS.map((p, i) => {
          const cover = COVER[p.slug]
          const external = p.href?.startsWith('http')
          return (
            <li key={p.slug} className="ed-rule ed-grid py-8 sm:py-10">
              <p className="ed-mono ed-c1-3">
                <span className="ed-num">{String(i + 1).padStart(2, '0')}</span> &nbsp;{p.kind}
              </p>
              <div className={cover ? 'ed-c4-9' : 'ed-c4-13'}>
                <h2 className="ed-serif ed-h2 mt-3 md:mt-0">{p.name}</h2>
                <p className="mt-5 max-w-[52ch] text-[1.05rem]">{p.line}</p>
                <dl className="ed-meta mt-6">
                  <dt>For</dt>
                  <dd>{p.forWhom}</dd>
                  <dt>Runs on</dt>
                  <dd>{p.platforms}</dd>
                  <dt>Status</dt>
                  <dd>{p.status}</dd>
                </dl>
                {p.href && (
                  <p className="mt-6">
                    {external ? (
                      <a href={p.href} className="ed-link" target="_blank" rel="noreferrer">
                        {p.href.replace('https://', '')} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <Link href={p.href} className="ed-link">
                        See the project <span aria-hidden="true">→</span>
                      </Link>
                    )}
                  </p>
                )}
              </div>
              {cover && (
                <div className="ed-c9-13 mt-8 md:mt-0">
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    width={cover.w}
                    height={cover.h}
                    unoptimized
                    className={cover.h > cover.w ? 'ed-phone mx-auto max-w-[220px]' : 'ed-shot'}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <section aria-label="Start a conversation" className="ed-wrap ed-rule pb-20 pt-16 sm:pb-28">
        <p className="ed-serif ed-h2 max-w-[18ch]">Yours could be the next line on this page.</p>
        <Link href={INQUIRE_PATH} className="ed-btn mt-8">
          {INQUIRE_CTA} <span className="ed-arrow" aria-hidden="true">→</span>
        </Link>
      </section>
    </EditorialChrome>
  )
}
