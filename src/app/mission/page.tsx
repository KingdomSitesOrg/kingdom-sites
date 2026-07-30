import Image from 'next/image'
import type { Metadata } from 'next'
import missionImage from '../../../public/Photos/mission-field.jpg'
import persecutedImage from '../../../public/Photos/persecuted-church.jpg'
import UnreachedScroll from '@/components/UnreachedScroll'

export const metadata: Metadata = {
  title: 'Our Mission — Kingdom Sites',
  description:
    'How your project supports gospel work in the unreached world, the organizations we stand with and give to, and who I build software for.',
  alternates: { canonical: '/mission' },
}

/* Organizations we stand with. Every link was checked; a couple of these sites
   sit behind bot protection, so they answer a browser but not a script.
   `note` is the line that shows once a card turns over. */
const ORGS = [
  {
    name: 'Voice of the Martyrs',
    url: 'https://www.persecution.com',
    what: 'Serves persecuted Christians worldwide',
    icon: 'book',
    how: 'Bibles, relief, and the stories of believers under pressure — the ones almost nobody else reports.',
    note: 'Started by Richard Wurmbrand, a pastor who spent fourteen years in Romanian prisons.',
  },
  {
    name: 'Open Doors',
    url: 'https://www.opendoors.org',
    what: 'Strengthens the church where following Jesus costs most',
    icon: 'door',
    how: 'Long-term presence in the hardest countries, and the annual watch list that tells the rest of us where to look.',
    note: 'Began with Brother Andrew carrying Bibles across the Iron Curtain.',
  },
  {
    name: 'International Christian Concern',
    url: 'https://www.persecution.org',
    what: 'Advocacy and relief for persecuted Christians',
    icon: 'megaphone',
    how: 'Puts names and cases in front of governments and the press, and gets aid to families who lost everything.',
    note: 'Advocacy work aimed at the people who can actually change a policy.',
  },
  {
    name: 'RUN Ministries',
    url: 'https://runministries.org',
    what: 'Disciple-making movements, church to church',
    icon: 'multiply',
    how: 'Training ordinary believers to start churches rather than waiting for professionals to arrive.',
    note: 'The multiplication side of the work: every disciple expected to make disciples.',
  },
  {
    name: 'No Place Left',
    url: 'https://noplaceleft.net',
    what: 'A coalition aiming at no place left unreached',
    icon: 'globe',
    how: 'The approaches we use ourselves: simple, reproducible, and handed straight to new believers.',
    note: 'A coalition rather than an organization — nobody owns it, anyone can run with it.',
  },
  {
    name: 'Operation Mobilization',
    url: 'https://www.om.org',
    what: 'Global mission across land and sea',
    icon: 'ship',
    how: 'Decades of work in places that took decades to reach, including ocean-going ships carrying books and help into port cities.',
    note: 'One of the older sending organizations still going, in well over a hundred countries.',
  },
  {
    name: 'GFA World',
    url: 'https://www.gfa.org',
    what: 'Serving the poorest in hard places',
    icon: 'drop',
    how: 'Clean water, literacy, and care for the people our own work is aimed at.',
    note: 'Wells, tuition, and medical care among communities with almost no Christian witness.',
  },
  {
    name: 'International Mission Board',
    url: 'https://www.imb.org',
    what: 'Sends and supports long-term workers',
    icon: 'send',
    how: 'The unglamorous infrastructure — training, sending, and staying — behind thousands of families overseas.',
    note: 'The sending body of the Southern Baptist Convention, at work since the 1840s.',
  },
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

/* One small mark per organization, drawn inline. Nothing loaded, nothing to
   maintain, and each one says something about the work. */
function OrgIcon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5v-12ZM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5v-12ZM12 6v13" />
        </svg>
      )
    case 'door':
      return (
        <svg {...common}>
          <path d="M6 20V4h9a2 2 0 0 1 2 2v14M6 20h13M13.5 12h.01M17 6l4 3v11h-4" />
        </svg>
      )
    case 'megaphone':
      return (
        <svg {...common}>
          <path d="M4 10v4l10 4V6L4 10ZM14 8.5a4 4 0 0 1 0 7M7 15v4h3v-3" />
        </svg>
      )
    case 'multiply':
      return (
        <svg {...common}>
          <path d="M12 4v4M12 8 7 13M12 8l5 5M7 13v3M17 13v3M5 19h4M15 19h4" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4c2.5 2.6 2.5 12.4 0 16-2.5-3.6-2.5-13.4 0-16Z" />
        </svg>
      )
    case 'ship':
      return (
        <svg {...common}>
          <path d="M4 14h16l-2 5H6l-2-5ZM7 14V9l5-4 5 4v5M12 5v9" />
        </svg>
      )
    case 'drop':
      return (
        <svg {...common}>
          <path d="M12 3.5c3 3.7 5.5 6.4 5.5 9.6A5.5 5.5 0 0 1 12 19a5.5 5.5 0 0 1-5.5-5.9c0-3.2 2.5-5.9 5.5-9.6Z" />
        </svg>
      )
    case 'send':
      return (
        <svg {...common}>
          <path d="M4 12 20 4l-4 16-5-6-7-2ZM11 14l9-10" />
        </svg>
      )
    default:
      return null
  }
}

export default function Mission() {
  return (
    <div className="band-dark w-full">
      {/* ---------- opening ---------- */}
      <section className="px-5 pb-14 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
        <div className="mx-auto grid max-w-6xl items-stretch gap-4 sm:gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-6">
            <div className="h-full min-h-[min(52vw,280px)] overflow-hidden rounded-[26px] border border-white/12 shadow-[0_28px_64px_rgba(0,0,0,0.5)] sm:min-h-[360px] lg:min-h-[480px]">
              <Image
                src={missionImage}
                alt="Mission work overseas"
                quality={80}
                placeholder="blur"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="eyebrow">Our mission work</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl">
              Mission work in the <span className="text-[#f0b48c]">unreached world.</span>
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-white/75 sm:text-lg">
              {"Billions of people have never heard the gospel once. Our desire is to see Jesus glorified throughout the unreached world. For security reasons I can't share specific details about where or with whom, but please reach out if you have any questions."}
            </p>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/65">
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

      {/* ---------- the photograph, held still while the lines pass over ----------
          The picture is stuck to the viewport; the sentences below it are pulled
          up over the top, so scrolling brings each one up from underneath. When
          the last one has gone by, the page carries on. No JavaScript involved. */}
      <section aria-label="The unreached" className="relative">
        <div
          className="sticky top-0 h-svh overflow-hidden bg-dark"
          style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
        >
          <Image
            src={persecutedImage}
            alt="A mother holding her child in front of a destroyed building"
            className="h-full w-full object-cover object-[62%_26%] opacity-70 sm:object-center"
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

          {/* Mobile: names and visit links float freely — no grid. */}
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-5 sm:hidden">
            {ORGS.map((org) => (
              <li key={org.name}>
                <a
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1"
                >
                  <span className="text-[15px] font-semibold leading-snug tracking-tight text-white">
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

          {/* Desktop: hover to turn a card over. */}
          <div className="mt-10 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {ORGS.map((org) => (
              <div key={org.name} className="flip">
                {/* No overflow clipping here: hiding overflow flattens the 3D
                    space, which showed the front face mirrored instead of the
                    back. The back carries its own rounded corners instead. */}
                <div className="flip-inner tile-dark transition-colors hover:border-white/25">
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flip-face flex min-h-[212px] flex-col p-6"
                  >
                    <span className="text-[#f0b48c]">
                      <OrgIcon name={org.icon} />
                    </span>
                    <span className="mt-4 text-base font-semibold leading-snug tracking-tight text-white">
                      {org.name}
                    </span>
                    <span className="mt-2 flex-1 text-sm leading-relaxed text-white/60">
                      {org.what}
                    </span>
                    <span className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[#f0b48c]">
                      Their site
                      <ArrowOut />
                    </span>
                  </a>

                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flip-back flip-face flex flex-col rounded-[22px] bg-[#1b2436] p-6"
                  >
                    <span className="text-sm leading-relaxed text-white/80">{org.how}</span>
                    <span className="mt-3 flex-1 text-[13px] leading-relaxed text-white/50">
                      {org.note}
                    </span>
                    <span className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[#f0b48c]">
                      Visit and give
                      <ArrowOut />
                    </span>
                  </a>
                </div>
              </div>
            ))}
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
