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
    what: 'Serving the poorest of South Asia',
    icon: 'drop',
    how: 'Clean water, literacy, and care for the people our own work is aimed at.',
    note: 'Wells, tuition, and medical care in the same region we are heading to.',
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

/* A dotted world, drawn from a grid rather than an image file. Each entry is a
   row and each pair is a run of columns that is land. Sixty columns spans the
   globe, so one column is six degrees of longitude and one row is about five
   degrees of latitude — enough resolution for the continents to be recognisable. */
const LAND: Record<number, [number, number][]> = {
  0:  [[21, 26], [37, 52]],
  1:  [[5, 20], [20, 27], [30, 56]],
  2:  [[3, 21], [20, 27], [29, 57]],
  3:  [[2, 21], [21, 26], [29, 58]],
  4:  [[3, 21], [22, 25], [28, 29], [30, 58]],
  5:  [[4, 21], [28, 58]],
  6:  [[5, 21], [28, 58]],
  7:  [[7, 21], [29, 57]],
  8:  [[8, 21], [28, 37], [38, 56]],
  9:  [[9, 20], [28, 31], [32, 33], [34, 36], [37, 55]],
  10: [[10, 19], [27, 38], [39, 54], [55, 56]],
  11: [[11, 17], [27, 38], [39, 53], [55, 56]],
  12: [[12, 17], [27, 38], [39, 41], [42, 45], [46, 53]],
  13: [[15, 19], [28, 38], [42, 45], [47, 52]],
  14: [[17, 23], [29, 37], [42, 45], [48, 53]],
  15: [[17, 24], [29, 37], [42, 44], [48, 54]],
  16: [[18, 25], [29, 37], [43, 44], [49, 53]],
  17: [[18, 25], [30, 36], [48, 55]],
  18: [[18, 24], [31, 36], [49, 55]],
  19: [[18, 23], [31, 36], [50, 56]],
  20: [[18, 22], [31, 36], [38, 39], [49, 56]],
  21: [[18, 22], [32, 35], [38, 39], [49, 56]],
  22: [[18, 21], [32, 34], [38, 39], [50, 55]],
  23: [[18, 21], [32, 34], [50, 54]],
  24: [[18, 21], [51, 53], [57, 58]],
  25: [[18, 20], [57, 58]],
  26: [[19, 20], [57, 58]],
  27: [[19, 20]],
}

const COLS = 60
const ROWS = 28

const isLand = (row: number, col: number) =>
  (LAND[row] ?? []).some(([from, to]) => col >= from && col <= to)

/* Where the work is, placed on the same grid. */
const PINS = [
  { label: 'South Asia', detail: 'Where we are going', left: '72.5%', top: '43.5%' },
  { label: 'Philippines', detail: 'Where we are training', left: '84.5%', top: '50%' },
]

function WorldMap() {
  return (
    <div className="relative mx-auto w-fit">
      <div className="flex flex-col gap-[2px] sm:gap-[3px]" aria-hidden="true">
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className="flex gap-[2px] sm:gap-[3px]">
            {Array.from({ length: COLS }, (_, col) => (
              <span
                key={col}
                className={`h-[3px] w-[3px] shrink-0 rounded-full sm:h-[5px] sm:w-[5px] ${
                  isLand(row, col) ? 'bg-white/45' : 'bg-white/[0.06]'
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
          <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f0b48c] opacity-70" />
            <span className="relative inline-flex h-full w-full rounded-full bg-[#f0b48c]" />
          </span>
        </div>
      ))}
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
          </div>
        </div>
      </section>

      {/* ---------- the photograph, cropped and faded ---------- */}
      <section aria-label="The cost of following Jesus" className="relative">
        {/* On a wide screen the frame matches the photograph's own proportions, so
            nothing is cropped away — faces included. On a phone it stays tall and
            holds the framing on the two of them rather than the rubble. */}
        <div className="relative h-[440px] overflow-hidden sm:aspect-[117/53] sm:h-auto">
          <Image
            src={persecutedImage}
            alt="A mother holding her child in front of a destroyed building"
            className="h-full w-full object-cover object-[58%_30%] opacity-70 sm:object-center"
            sizes="100vw"
          />
          {/* Dark at the edges so the band blends into the page, clear through the
              middle so the faces are not lost behind it. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(17,24,39,0.75) 0%, rgba(17,24,39,0.12) 30%, rgba(17,24,39,0.12) 55%, rgba(17,24,39,0.92) 100%)',
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center px-6 pb-16 sm:pb-24">
            <p className="max-w-2xl text-balance text-center text-lg font-medium leading-snug text-white sm:text-2xl">
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
                <div className="flip-inner tile-dark overflow-hidden transition-colors hover:border-white/25">
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
                    className="flip-back flip-face flex flex-col bg-[#1b2436] p-6"
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

      {/* ---------- the map ---------- */}
      <section aria-label="Where the work is" className="border-t border-white/10 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="eyebrow">Where the work is</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Training here. Going there.
            </h2>
          </div>
          <div className="mt-12 overflow-x-auto">
            <WorldMap />
          </div>
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
