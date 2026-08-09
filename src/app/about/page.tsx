import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  INQUIRE_CTA,
  INQUIRE_PATH,
  SALES_EMAIL,
  SALES_MAILTO,
  SALES_NAME,
  TEAM,
  type TeamMember,
} from '@/lib/contact'
import { ENTRY_PRICE_LABEL } from '@/lib/partnership'

export const metadata: Metadata = {
  title: 'About — Kingdom Sites',
  description:
    'Meet Thomas Klein (product ownership & engineering) and Jack (sales) at Kingdom Sites — custom products owned with founders and product owners.',
  alternates: { canonical: '/about' },
}

function TeamPhoto({ member }: { member: TeamMember }) {
  if (member.photoSrc) {
    return (
      <div className="tile-elevated overflow-hidden">
        <Image
          src={member.photoSrc}
          alt={member.photoAlt}
          width={640}
          height={800}
          quality={75}
          className="h-auto w-full object-cover"
          sizes="(max-width: 768px) 90vw, 280px"
          priority={member.id === 'thomas'}
        />
      </div>
    )
  }

  /* Photo not uploaded yet — initials placeholder until public/Photos/jack.jpg exists. */
  const initial = member.name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      className="tile-elevated flex aspect-[4/5] w-full flex-col items-center justify-center bg-surface-2 px-6 text-center"
      aria-label={`${member.name} — photo coming soon`}
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/12 text-3xl font-semibold text-accent">
        {initial}
      </span>
      <p className="mt-5 text-sm font-medium text-ink">{member.name}</p>
      <p className="mt-1 text-[13px] text-muted">Photo coming soon</p>
    </div>
  )
}

export default function About() {
  const thomas = TEAM.find((m) => m.id === 'thomas')!
  const jack = TEAM.find((m) => m.id === 'jack')!

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="max-w-2xl">
        <p className="eyebrow">About</p>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
          A little bit <span className="text-accent">about us.</span>
        </h1>
        <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">
          Kingdom Sites is a small team: engineering that owns the product with you, and sales so
          the first conversation is easy. We take on a limited number of ownership relationships
          at a time, on purpose.
        </p>
      </div>

      {/* Team */}
      <section aria-label="The team" className="mt-14">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8 lg:gap-12">
          {[thomas, jack].map((member) => (
            <article key={member.id} className="flex flex-col">
              <div className="mx-auto w-full max-w-sm sm:mx-0">
                <TeamPhoto member={member} />
              </div>
              <h2 className="mt-6 text-xl font-semibold tracking-tight text-ink">{member.name}</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-warm">
                {member.role}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-body">{member.blurb}</p>
              <a href={member.mailto} className="link-accent mt-4 text-sm">
                {member.email}
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Thomas context that does not fit a one-liner */}
      <section aria-label="How we work" className="mt-16 border-t border-line pt-14">
        <div className="grid gap-4">
          <div className="tile p-6">
            <h2 className="text-sm font-semibold tracking-tight text-ink">
              Product ownership, not a handoff
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              A retainer relationship: roadmap with you, design, build, release, support. Month to
              month is fine; prepay discounts if you want them. From about {ENTRY_PRICE_LABEL}/month
              after a call places your product on Focused, Full, or Intensive.{' '}
              <Link href="/#services" className="link-accent">
                How ownership works <span aria-hidden="true">›</span>
              </Link>
            </p>
          </div>

          <div className="tile p-6">
            <h2 className="text-sm font-semibold tracking-tight text-ink">Shipped proof</h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              Ruta (service-management platform — web, mobile, AI), Jam with Latin (mobile learning
              product on a retainer), and Tap to Tick (personal iOS expense app). Proof of how
              Thomas works — not products Kingdom Sites sells off the shelf.{' '}
              <Link href="/my-work" className="link-accent">
                Proof portfolio <span aria-hidden="true">›</span>
              </Link>
            </p>
          </div>

          <div className="tile p-6">
            <h2 className="text-sm font-semibold tracking-tight text-ink">Free websites for ministries</h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              Ministries, missionaries raising support, and churches get the site built for free
              <span className="align-super text-[0.6em] text-accent">*</span> — the same care a
              paying client gets. It is one of the ways this business goes toward the advance of
              the gospel.{' '}
              <Link href="/mission" className="link-accent">
                Our mission <span aria-hidden="true">›</span>
              </Link>
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              <span className="align-super text-[0.75em] text-accent">*</span> Engineering time is
              the donation. The running costs — the domain name, hosting, and any outside service
              the site depends on — stay with you, billed to you directly.
            </p>
          </div>

          <div className="tile p-6">
            <h2 className="text-sm font-semibold tracking-tight text-ink">Where Thomas is</h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              Thomas and his wife Monisha are currently in the Philippines at IGSL — the
              International Graduate School of Leadership — training in biblical studies and
              discipleship. Client work carries on from there on the same timelines as always.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <Link href={INQUIRE_PATH} className="btn-primary">
            {INQUIRE_CTA}
          </Link>
          <p className="mt-4 text-sm text-body">
            Sales:{' '}
            <a href={SALES_MAILTO} className="link-accent">
              {SALES_NAME} · {SALES_EMAIL}
            </a>
            {' · '}
            Engineering:{' '}
            <a href={CONTACT_MAILTO} className="link-accent">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-3 text-sm text-muted">
            <Link href="/software" className="underline underline-offset-4">
              Custom product ownership
            </Link>
            {' · '}
            <Link href="/#services" className="underline underline-offset-4">
              Pricing
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
