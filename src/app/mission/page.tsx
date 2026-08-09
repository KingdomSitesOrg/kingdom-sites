import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import persecutedImage from '../../../public/Photos/persecuted-church.jpg'
import UnreachedScroll from '@/components/UnreachedScroll'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'Our Mission — Kingdom Sites',
  description:
    'How your project supports gospel work in the unreached world, the organizations we stand with and give to, and who I build software for.',
  alternates: { canonical: '/mission' },
}

/* Organizations we stand with. Every link was checked; a couple of these sites
   sit behind bot protection, so they answer a browser but not a script. */
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

function ArrowOut() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M4 8 8 4M8 4H4.8M8 4v3.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Mission() {
  return (
    <div className="band-dark w-full">
      {/* ---------- the photograph, held still while the lines pass over ----------
          This is the opening of the page: no separate hero above it.
          The picture is stuck to the viewport; the sentences below it are pulled
          up over the top, so scrolling brings each one up from underneath. When
          the last one has gone by, the page carries on. No JavaScript involved. */}
      <section aria-label="The unreached" className="relative">
        <div
          className="sticky top-0 h-svh overflow-hidden bg-dark"
          style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
        >
          {/* On a phone the crop sits further right and higher up in the frame so
              the woman's face is inside the picture rather than cut off. */}
          <Image
            src={persecutedImage}
            alt="A mother holding her child in front of a destroyed building"
            className="h-full w-full object-cover object-[70%_18%] opacity-70 sm:object-center"
            sizes="100vw"
            priority
          />
          {/* Dark at the edges so the words carry, clear across the middle. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(17,24,39,0.9) 0%, rgba(17,24,39,0.45) 26%, rgba(17,24,39,0.12) 50%, rgba(17,24,39,0.55) 78%, rgba(17,24,39,0.95) 100%)',
            }}
            aria-hidden="true"
          />
        </div>

        <UnreachedScroll />
      </section>

      {/* ---------- why this exists ---------- */}
      <section aria-label="Why this exists" className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="eyebrow">Why this exists</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              The software pays for the mission.
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-white/70 sm:text-base">
              <p>
                Kingdom Sites is not a side project that happens to have a cause attached. It is how
                the ministry is funded. Every website, app, and platform I am paid to build supports
                training now and long-term work among people with almost no access to the gospel.
              </p>
              <p>
                A percentage of everything I earn goes to the organizations below, on top of what
                funds our own training and work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- the persecuted church ---------- */}
      <section aria-label="Who we stand with" className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="eyebrow">Who we stand with</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              We stand with the persecuted church.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/70 sm:text-base">
              Directly and indirectly, for and with organizations like these. Some of them we work
              alongside; others we simply support, give to, and pray for. Naming them here is not a
              claim of partnership or endorsement in either direction — they are listed because the
              work is worth knowing about.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70 sm:text-base">
              A percentage of my income goes to organizations on this list.{' '}
              <span className="text-white">Consider giving to them yourself</span> — every one of these
              takes donations, and the links go straight to their own sites.
            </p>
          </div>

          {/* Same plain-link grid on every width — no borders, no flip cards. */}
          {/* 8 orgs → 2×4 or 4×2 only; no 3-col (leaves 2 orphans). See /squareup. */}
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4">
            {ORGS.map((org) => (
              <li key={org.name}>
                <a
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1.5 transition-opacity hover:opacity-80"
                >
                  <span className="text-[15px] font-semibold leading-snug tracking-tight text-white sm:text-base">
                    {org.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#f0b48c]">
                    Visit and give
                    <ArrowOut />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- prayer initiative ---------- */}
      <section aria-label="Prayer for the unreached" className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="eyebrow">Prayer</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              A weekly prayer meeting for the unreached.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/70 sm:text-base">
              Romans 10:14 — how will they hear if no one tells them? The Prayer mini-site is a
              simple kit for running a weekly meeting: a verse, a story, facts, prayer points, and
              free guides you can download and use with a group.
            </p>
            <div className="mt-7">
              <Link
                href="/prayer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#f0b48c] transition-colors hover:text-[#f5c9a8]"
              >
                Open the prayer site
                <ArrowOut />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- donated websites ---------- */}
      <section
        id="free-ministry-sites"
        aria-label="Donated websites"
        className="scroll-mt-20 border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="eyebrow">Free of charge</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              I donate websites to ministries.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/70 sm:text-base">
              Ministries, missionaries raising support, and churches get the site built for free
              <span className="align-super text-[0.6em] text-[#f0b48c]">*</span> — designed, built,
              and put live, the same way a paying client gets it. It is one of the ways I can put
              this work behind the advance of the gospel rather than only behind a business.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70 sm:text-base">
              If that is you,{' '}
              <Link href={INQUIRE_PATH} className="text-white underline underline-offset-4 hover:text-[#f0b48c]">
                {INQUIRE_CTA}
              </Link>
              .
            </p>
            <p className="mt-6 text-[13px] leading-relaxed text-white/45">
              <span className="align-super text-[0.75em] text-[#f0b48c]">*</span> My time is the
              donation. The running costs stay with you — the domain name, hosting, and anything
              paid to an outside service the site depends on. Those are billed to you directly, not
              through me, and they are usually a few dollars a month.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- what the work is ----------
          The opening paragraphs used to sit at the very top of the page; the
          scrolling photograph carries the opening now, so they read here
          instead, just before the video. */}
      <section aria-label="Our mission work" className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="eyebrow">Our mission work</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Mission work in the <span className="text-[#f0b48c]">unreached world.</span>
            </h2>
            <p className="mt-6 text-pretty text-[15px] leading-relaxed text-white/75 sm:text-base">
              {"Billions of people have never heard the gospel once. Our desire is to see Jesus glorified throughout the unreached world. For security reasons I can't share specific details about where or with whom, but please reach out if you have any questions."}
            </p>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-white/65 sm:text-base">
              <p>
                We collaborate with Christians toward seeing movements of Christ among Muslim-majority
                people groups in the unreached world, using approaches from No Place Left.
              </p>
              <p>
                Your project fuels long-term mission work among people with little access to the
                gospel. My wife and I are in training for long-term ministry overseas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- watch ---------- */}
      <section aria-label="Watch" className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">Watch</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                A window into the work.
              </h2>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <a
                href="https://www.youtube.com/watch?v=yMTVM0IeqH4"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#f0b48c] transition-colors hover:text-[#f5c9a8]"
              >
                Watch on YouTube
                <ArrowOut />
              </a>
              <a
                href="https://www.youtube.com/@tkklein/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/65 transition-colors hover:text-white"
              >
                My YouTube channel
                <ArrowOut />
              </a>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[22px] border border-white/12 bg-black shadow-[0_28px_64px_rgba(0,0,0,0.5)]">
            <div className="relative aspect-video w-full">
              <iframe
                src="https://www.youtube.com/embed/yMTVM0IeqH4"
                title="Mission work video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
