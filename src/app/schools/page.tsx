import Link from 'next/link'
import type { Metadata } from 'next'
import { Close, HowItStarts, Needs, OtherPages, Questions } from '@/components/cinematic/Audience'
import { Browser, Phone } from '@/components/cinematic/Frames'
import LatinPartner from '@/components/cinematic/LatinPartner'
import Scroll from '@/components/cinematic/Scroll'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { jsonLd, serviceLd, shareCard, type Faq } from '@/lib/seo'
import { PROJECTS, SHOTS } from '@/lib/work'

/* Schools, co-ops and teachers (T-387): "custom school software", "software
   for a homeschool co-op", "class sign-up and payments for schools". Farzana
   Classroom is the proof, shown with Wren Hall, its made-up demo school; JAM
   Legio is the proof that students use what I build. */

const DESCRIPTION =
  'Software for schools, homeschool co-ops and teachers: classes, sign-ups, families and online payments in one place, on Farzana Classroom by Thomas Klein.'

export const metadata: Metadata = {
  title: 'Software for schools and co-ops: classes, sign-ups and payments',
  description: DESCRIPTION,
  alternates: { canonical: '/schools' },
  ...shareCard('Classes, sign-ups and payments for schools — Kingdom Sites', DESCRIPTION, '/schools'),
}

const PRODUCT = 'Farzana Classroom'
const DEMO = 'Demo school'
const farzana = PROJECTS.find((p) => p.slug === 'farzana')!

const NEEDS = [
  {
    title: 'Classes families can find.',
    body: 'A public list of your classes, each with its price, and a free sample to try before signing up.',
  },
  {
    title: 'Sign-up and payment online.',
    body: 'Families find a class, sign up and pay at any hour, without you at a desk.',
  },
  {
    title: 'Who is enrolled, at a glance.',
    body: 'See who is enrolled, who was active this week and who just joined.',
  },
  {
    title: 'Shaped to your school.',
    body: 'Your classes, families and payments in one place, customized to how your school already works.',
  },
]

const QUESTIONS: Faq[] = [
  {
    q: 'Does it work for a homeschool co-op or a single teacher?',
    a: 'Yes. Farzana Classroom is for schools, training organizations, education businesses or anyone who teaches classes, customized to your needs.',
  },
  {
    q: 'Can families pay online?',
    a: 'Yes. Families sign up and pay online at any hour, and classes, families and payments live in one place instead of three tools stitched together.',
  },
  {
    q: 'Is Farzana Classroom ready to use?',
    a: 'It is in beta, and the first school is coming soon. Tell me about your school and I will tell you plainly whether it fits yet.',
  },
  {
    q: 'What does it cost?',
    a: 'Every school is quoted once I understand what it needs. You and I talk first, and you get a plan and an exact quote.',
  },
]

export default function Schools() {
  return (
    <div className="w-full overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            serviceLd({
              name: 'Classes, sign-ups and payments for schools',
              description: DESCRIPTION,
              path: '/schools',
              audience: 'Schools, homeschool co-ops, tutoring schools and teachers',
            }),
          ),
        }}
      />

      <section className="cn-wrap pt-16 sm:pt-24">
        <p className="cn-kicker cn-rise">Schools, co-ops and teachers</p>
        <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 max-w-[15ch] text-balance">
          Classes, <span className="cn-nowrap">sign-ups</span> and payments for schools.
        </h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <p className="cn-body cn-rise cn-rise-3 max-w-[50ch] text-pretty">
            For schools, homeschool co-ops, tutoring schools and anyone who teaches classes. Families find a class, sign up
            and pay online, and you see who is enrolled, in one place instead of three tools stitched together.
          </p>
          <div className="cn-rise cn-rise-3 flex flex-wrap gap-3 lg:justify-end">
            <Link href={INQUIRE_PATH} className="cn-btn">
              {INQUIRE_CTA} <span aria-hidden="true">→</span>
            </Link>
            <a href="#farzana" className="cn-ghost">
              See Farzana Classroom <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className="cn-rise cn-rise-3 mx-auto mt-14 max-w-[1180px] sm:mt-20">
          <Browser shot={SHOTS.farzanaClasses} product={PRODUCT} note={DEMO} priority />
        </div>
      </section>

      <section aria-labelledby="needs" className="cn-wrap mt-28 sm:mt-40">
        <p className="cn-kicker">What it does</p>
        <h2 id="needs" className="cn-display cn-h2 mt-5 max-w-[16ch]">
          What a school usually needs.
        </h2>
        <Needs items={NEEDS} />
      </section>

      <section id="farzana" aria-labelledby="farzana-h" className="mt-28 scroll-mt-20 sm:mt-40">
        <div className="cn-wrap grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <p className="cn-kicker">Proof · Platform</p>
            <h2 id="farzana-h" className="cn-display cn-h2 mt-5">
              Built on Farzana Classroom.
            </h2>
          </div>
          <div>
            <p className="cn-body text-pretty">
              I built Farzana Classroom from the ground up as a stable, quality, easy-to-navigate classroom app. Everything is
              stitched together, from payments to quiz results.
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--dim)]">
              {farzana.status}. The screens here show Wren Hall, a made-up demo school.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={farzana.href!} className="cn-ghost">
                The Farzana Classroom story <span aria-hidden="true">→</span>
              </Link>
              <a href={farzana.site} target="_blank" rel="noopener noreferrer" className="cn-ghost">
                farzana.app <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
        {/* Two windows side by side, drifting in like the phones in a depth row (T-403). */}
        <Scroll className="cn-wrap mt-16 pb-6">
          <div className="cn-depth cn-depth-pair mx-auto max-w-[1180px]">
            <Browser shot={SHOTS.farzanaClass} product={PRODUCT} note={DEMO} />
            <Browser shot={SHOTS.farzanaDesk} product={PRODUCT} note={DEMO} />
          </div>
        </Scroll>
      </section>

      <section id="latin" aria-labelledby="latin-h" className="mt-28 scroll-mt-20 sm:mt-40">
        <div className="cn-wrap grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <p className="cn-kicker">Proof · For students</p>
            <h2 id="latin-h" className="cn-display cn-h2 mt-5">
              JAM Legio, a Latin game.
            </h2>
          </div>
          <div>
            <p className="cn-body text-pretty">
              A Latin vocabulary game for iPhone and Android, for homeschool and classical students. Students march a legion
              north across Italy, thirteen stops from Rōma to Gallia, and every city teaches one piece of the classical
              curriculum. It is on the App Store and Google Play.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/latin-game" className="cn-ghost">
                See JAM Legio <span aria-hidden="true">→</span>
              </Link>
            </div>
            <LatinPartner />
          </div>
        </div>
        <Scroll className="cn-wrap mt-16 sm:mt-20">
          <div className="cn-depth mx-auto max-w-[1180px]">
            {[SHOTS.latinHome, SHOTS.latinMap, SHOTS.latinCase, SHOTS.latinBoard].map((s) => (
              <Phone key={s.src} shot={s} />
            ))}
          </div>
        </Scroll>
      </section>

      <HowItStarts />
      <Questions items={QUESTIONS} />
      <OtherPages here="/schools" />

      <Close
        title="Your school could be next."
        body="Tell me about your school, co-op or classes and what you need. You talk to me, Thomas, the person who will build it."
      />
    </div>
  )
}
