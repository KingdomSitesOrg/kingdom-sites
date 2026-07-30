import Image from 'next/image'
import type { Metadata } from 'next'
import southasiaImage from '../../../public/Photos/southasia.jpg'
import persecutedImage from '../../../public/Photos/persecuted-church.png'
import ContactCta from '@/components/ContactCta'

export const metadata: Metadata = {
  title: 'Our Mission — Kingdom Sites',
  description:
    'How your project supports gospel work in South Asia, the organizations we stand with and give to, and who I build software for.',
  alternates: { canonical: '/mission' },
}

/* Organizations we stand with. Every link was checked; a couple of these sites
   sit behind bot protection, so they answer a browser but not a script. */
const ORGS = [
  {
    name: 'Voice of the Martyrs',
    url: 'https://www.persecution.com',
    what: 'Serves persecuted Christians worldwide',
    how: 'Bibles, relief, and the stories of believers under pressure — the ones almost nobody else reports.',
  },
  {
    name: 'Open Doors',
    url: 'https://www.opendoors.org',
    what: 'Strengthens the church where following Jesus costs most',
    how: 'Long-term presence in the hardest countries, and the annual watch list that tells the rest of us where to look.',
  },
  {
    name: 'International Christian Concern',
    url: 'https://www.persecution.org',
    what: 'Advocacy and relief for persecuted Christians',
    how: 'Puts names and cases in front of governments and the press, and gets aid to families who lost everything.',
  },
  {
    name: 'RUN Ministries',
    url: 'https://runministries.org',
    what: 'Disciple-making movements, church to church',
    how: 'Training ordinary believers to start churches rather than waiting for professionals to arrive.',
  },
  {
    name: 'No Place Left',
    url: 'https://noplaceleft.net',
    what: 'A coalition aiming at no place left unreached',
    how: 'The approaches we use ourselves: simple, reproducible, and handed straight to new believers.',
  },
  {
    name: 'Operation Mobilization',
    url: 'https://www.om.org',
    what: 'Global mission across land and sea',
    how: 'Decades in places that took decades to reach, including the ship that carries books and help into port cities.',
  },
  {
    name: 'GFA World',
    url: 'https://www.gfa.org',
    what: 'Serving the poorest of South Asia',
    how: 'Clean water, literacy, and care for the people our own work is aimed at.',
  },
  {
    name: 'International Mission Board',
    url: 'https://www.imb.org',
    what: 'Sends and supports long-term workers',
    how: 'The unglamorous infrastructure — training, sending, and staying — behind thousands of families overseas.',
  },
]

/* A dotted world, drawn from a coarse grid rather than an image file. Each entry
   is a row, and each pair is a run of columns that is land. 44 columns spans the
   globe, so one column is roughly eight degrees of longitude. */
const LAND: Record<number, [number, number][]> = {
  0: [[17, 19], [30, 38]],
  1: [[3, 13], [16, 19], [21, 40]],
  2: [[3, 13], [17, 19], [21, 41]],
  3: [[4, 13], [22, 41]],
  4: [[5, 12], [22, 40]],
  5: [[6, 12], [21, 26], [28, 39]],
  6: [[7, 11], [20, 27], [29, 38]],
  7: [[8, 11], [20, 28], [30, 37]],
  8: [[9, 11], [21, 28], [32, 34], [36, 37]],
  9: [[11, 13], [21, 27], [32, 34], [36, 38]],
  10: [[12, 16], [22, 27], [33, 33], [36, 38]],
  11: [[13, 16], [22, 26], [37, 38]],
  12: [[13, 16], [22, 26], [36, 40]],
  13: [[13, 16], [23, 26], [36, 40]],
  14: [[14, 16], [23, 25], [37, 40]],
  15: [[14, 15], [23, 24], [38, 39]],
  16: [[14, 15], [24, 24]],
  17: [[14, 15]],
  18: [[14, 14]],
  19: [],
}

const COLS = 44
const ROWS = 20

const isLand = (row: number, col: number) =>
  (LAND[row] ?? []).some(([from, to]) => col >= from && col <= to)

/* Where the work is. Percentages are positions on the same grid. */
const PINS = [
  { label: 'South Asia', detail: 'Where we are going', left: '76%', top: '47%' },
  { label: 'Philippines', detail: 'Where we are training', left: '88%', top: '50%' },
]

function WorldMap() {
  return (
    <div className="relative">
      <div className="flex flex-col gap-[6px]" aria-hidden="true">
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className="flex justify-between gap-[6px]">
            {Array.from({ length: COLS }, (_, col) => (
              <span
                key={col}
                className={`h-[5px] w-[5px] shrink-0 rounded-full ${
                  isLand(row, col) ? 'bg-white/40' : 'bg-white/[0.07]'
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      {PINS.map((pin) => (
        <div
          key={pin.label}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: pin.left, top: pin.top }}
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f0b48c] opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#f0b48c]" />
          </span>
        </div>
      ))}

      <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
        {PINS.map((pin) => (
          <li key={pin.label} className="flex items-center gap-2 text-white/70">
            <span className="h-2 w-2 rounded-full bg-[#f0b48c]" aria-hidden="true" />
            <span className="font-medium text-white">{pin.label}</span>
            <span className="text-white/45">— {pin.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const WHO = [
  {
    title: 'Small businesses',
    desc: 'From local shops to growing startups — software that helps you operate more efficiently and reach more customers.',
  },
  {
    title: 'Agencies',
    desc: 'Need a trusted development partner for client work? I take white label projects, with the same quality and process as my direct ones.',
  },
  {
    title: 'Non-profits and organizations',
    desc: 'I love working with mission-driven organizations that need reliable, well-built software at a fair rate.',
  },
  {
    title: 'Growing teams',
    desc: 'Custom tools, mobile apps, dashboards, and platforms for teams who have outgrown spreadsheets and off-the-shelf software.',
  },
]

export default function Mission() {
  return (
    <div className="band-dark w-full overflow-x-clip">
      {/* ---------- opening ---------- */}
      <section className="px-5 pb-14 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
        <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-[26px] border border-white/12 shadow-[0_28px_64px_rgba(0,0,0,0.5)]">
              <Image
                src={southasiaImage}
                alt="South Asia mission work"
                quality={75}
                placeholder="blur"
                className="w-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="eyebrow">Our mission work</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl">
              Mission work <span className="text-[#f0b48c]">around the world.</span>
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-white/75 sm:text-lg">
              {"In South Asia, 1.8 billion people have never heard the gospel. Our desire is to see Jesus glorified throughout South Asia. For security reasons I can't share specific details, but please reach out if you have any questions."}
            </p>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/65">
              <p>
                We collaborate with Christians toward seeing movements of Christ among Muslim-majority
                people groups in South Asia, using approaches from No Place Left.
              </p>
              <p>
                Your project fuels long-term mission work among people with little access to the
                gospel. My wife and I are in training for long-term ministry in South Asia.
              </p>
            </div>

            <div className="mt-8">
              <ContactCta label="Start a Project" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- the photograph, cropped and faded ---------- */}
      <section aria-label="The cost of following Jesus" className="relative">
        <div className="relative h-[240px] overflow-hidden sm:h-[320px]">
          <Image
            src={persecutedImage}
            alt="A mother holding her child in front of a destroyed building"
            className="h-full w-full object-cover opacity-45"
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(17,24,39,0.85) 0%, rgba(17,24,39,0.35) 45%, rgba(17,24,39,0.95) 100%)',
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <p className="max-w-2xl text-balance text-center text-lg font-medium leading-snug text-white/90 sm:text-2xl">
              For millions of people, following Jesus costs everything they have.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- why this exists ---------- */}
      <section aria-label="Why this exists" className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">Why this exists</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            The software pays for the mission.
          </h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-white/70 sm:text-base">
            <p>
              Kingdom Sites is not a side project that happens to have a cause attached. It is how the
              ministry is funded. Every website, app, and platform I am paid to build supports training
              now and long-term work among people with almost no access to the gospel.
            </p>
            <p>
              That shapes how I work more than it sounds like it would. I quote competitively rather
              than at agency rates, because the goal is steady work I can do well, not the largest
              possible invoice. I stay on after launch, because a client who is still here in two years
              is worth more than a bigger cheque today. And I say no to work I cannot do properly.
            </p>
            <p>
              A percentage of everything I earn goes to the organizations below, on top of what funds
              our own training and work.
            </p>
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

          {/* Hover to turn a card over; tap on a phone opens the site. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORGS.map((org) => (
              <div key={org.name} className="flip">
                <div className="flip-inner">
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flip-face tile-dark flex min-h-[196px] flex-col justify-between p-6 transition-colors hover:border-white/25"
                  >
                    <span className="text-base font-semibold leading-snug tracking-tight text-white">
                      {org.name}
                    </span>
                    <span className="text-sm leading-relaxed text-white/60">{org.what}</span>
                  </a>

                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flip-back flip-face tile-dark flex flex-col justify-between bg-[#1b2436] p-6"
                  >
                    <span className="text-sm leading-relaxed text-white/75">{org.how}</span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[#f0b48c]">
                      Visit and give
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path
                          d="M4 8 8 4M8 4H4.8M8 4v3.2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- the map ---------- */}
      <section aria-label="Where the work is" className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="eyebrow">Where the work is</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Training here. Going there.
            </h2>
          </div>
          <div className="mt-12">
            <WorldMap />
          </div>
        </div>
      </section>

      {/* ---------- who I work with ---------- */}
      <section aria-label="Who I work with" className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Who I work with
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/65">
            Businesses and organizations of any size, on any project.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {WHO.map((item) => (
              <div key={item.title} className="tile-dark p-6">
                <h3 className="text-base font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-white/10 pt-10 text-center">
            <ContactCta label="Email me about your project" />
          </div>
        </div>
      </section>
    </div>
  )
}
