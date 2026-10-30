import Link from 'next/link'
import type { Metadata } from 'next'
import CinematicChrome from '@/components/cinematic/Chrome'
import { Browser, Phone } from '@/components/cinematic/Frames'
import Scroll from '@/components/cinematic/Scroll'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { PROJECTS, SHOTS } from '@/lib/work'

export const metadata: Metadata = {
  title: 'Farzana Classroom',
  description: 'How Kingdom Sites built Farzana Classroom, education software for schools: one platform, with each school’s own features built on top.',
  alternates: { canonical: '/work/farzana' },
}

const farzana = PROJECTS.find((p) => p.slug === 'farzana')!
const PRODUCT = 'Farzana Classroom'
const DEMO = 'Demo school'

/* What the platform does today, from the checked facts in src/lib/work.ts. */
const FEATURES = [
  ['Classes, week by week', 'Built in modules and weeks, kept hidden until they are ready, then published.'],
  ['A shop', 'Classes and workbooks for sale, coupon codes, combos and free samples.'],
  ['Students', 'Every student, searchable, filtered by class, progress and when they joined.'],
  ['Email, analytics, payments', 'Writing to students, seeing who is active and who just joined, and taking payment, in the same place.'],
]

export default function FarzanaCase() {
  return (
    <CinematicChrome>
      <Scroll mode="sticky" className="cn-hero" aria-label="Farzana Classroom">
        <div className="cn-wrap pt-16 sm:pt-24">
          <p className="cn-kicker">Case study · Platform</p>
          <h1 className="cn-display cn-h1 mt-5">Farzana Classroom</h1>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <p className="cn-body max-w-[48ch]">{farzana.line}</p>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[15px]">
              <dt className="cn-dim">For</dt>
              <dd>{farzana.forWhom}</dd>
              <dt className="cn-dim">Made</dt>
              <dd>The platform, the site, the brand</dd>
              <dt className="cn-dim">Runs on</dt>
              <dd>{farzana.platforms}</dd>
              <dt className="cn-dim">Status</dt>
              <dd>{farzana.status}</dd>
            </dl>
          </div>
        </div>
        <Scroll prop="--q" className="cn-wrap cn-stage mt-14 pb-24 sm:mt-20 sm:pb-36">
          <div className="cn-tilt mx-auto max-w-[1180px]">
            <Browser shot={SHOTS.farzanaSite} product={PRODUCT} priority />
          </div>
        </Scroll>
      </Scroll>

      <section aria-labelledby="idea" className="cn-wrap mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <h2 id="idea" className="cn-display cn-h2">One platform. Each school its own.</h2>
        <div className="cn-body space-y-5">
          <p>
            Schools are alike in the basics and different in everything that matters to them. Farzana Classroom starts from a
            platform that already handles the basics, and builds each school’s own features, workflows and integrations
            on top.
          </p>
          <p>The school works directly with the developer who builds it.</p>
        </div>
      </section>

      {/* Two sides of one school. */}
      <section aria-labelledby="sides" className="cn-wrap mt-32 sm:mt-44">
        <p className="cn-kicker">A demo school</p>
        <h2 id="sides" className="cn-display cn-h2 mt-4 max-w-[14ch]">Both sides of the desk.</h2>
        <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-10">
          <Scroll>
            <div className="cn-reveal">
              <Browser shot={SHOTS.farzanaClass} product={PRODUCT} note={DEMO} />
              <h3 className="cn-display cn-h3 mt-8">What a family sees</h3>
              <p className="cn-body mt-3 max-w-[40ch]">
                A page for each class: what it is, who it is for, and a sample to try before signing up.
              </p>
            </div>
          </Scroll>
          <Scroll>
            <div className="cn-reveal lg:mt-40">
              <Browser shot={SHOTS.farzanaDesk} product={PRODUCT} note={DEMO} />
              <h3 className="cn-display cn-h3 mt-8">What the teacher sees</h3>
              <p className="cn-body mt-3 max-w-[40ch]">
                How many students the school has, who was active this week, and who just joined.
              </p>
            </div>
          </Scroll>
        </div>
      </section>

      {/* On the phone. */}
      <section aria-labelledby="phone" className="mt-32 sm:mt-44">
        <div className="cn-wrap">
          <h2 id="phone" className="cn-display cn-h2 max-w-[16ch]">The same school, from a phone.</h2>
        </div>
        <Scroll className="cn-wrap mt-16 pb-28">
          <div className="cn-depth mx-auto max-w-[1000px]" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <Phone shot={SHOTS.farzanaSitePhone} />
            <Phone shot={SHOTS.farzanaClassPhone} />
            <Phone shot={SHOTS.farzanaStudentsPhone} />
          </div>
        </Scroll>
      </section>

      <section aria-labelledby="does" className="cn-wrap mt-16">
        <p id="does" className="cn-kicker">What it does today</p>
        <div className="mt-8 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {FEATURES.map(([t, b]) => (
            <Scroll key={t}>
              <div className="cn-reveal cn-card">
                <h3 className="cn-display cn-h3">{t}</h3>
                <p className="cn-body mt-3">{b}</p>
              </div>
            </Scroll>
          ))}
        </div>
        <div className="mt-16">
          <Browser shot={SHOTS.farzanaStudents} product={PRODUCT} note={DEMO} />
        </div>
      </section>

      <section aria-label="Start a conversation" className="cn-wrap pb-28 pt-36 text-center sm:pb-40 sm:pt-48">
        <h2 className="cn-display cn-h1 mx-auto max-w-[12ch]">Have a school?</h2>
        <p className="cn-body mx-auto mt-6 max-w-[40ch]">Tell us how it runs today, and what you keep working around.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={INQUIRE_PATH} className="cn-btn">
            {INQUIRE_CTA} <span aria-hidden="true">→</span>
          </Link>
          <a href="https://farzana.app" className="cn-ghost">
            farzana.app <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </CinematicChrome>
  )
}
