import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import aboutImage from '../../../public/Photos/about.jpg'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { ENTRY_PRICE_LABEL } from '@/lib/partnership'

export const metadata: Metadata = {
 title: 'About — Kingdom Sites',
 description:
  'Thomas Klein — software engineer and product ownership partner for founders and product owners. Shipped proof: Ruta, Jam with Latin, and Tap to Tick.',
 alternates: { canonical: '/about' },
}

export default function About() {
 return (
  <div className="mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
   <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
    <div className="lg:col-span-5">
     <div className="relative mx-auto w-full max-w-md">
      <div className="tile-elevated">
       <Image
        src={aboutImage}
        alt="Thomas and Monisha"
        quality={75}
        placeholder="blur"
        className="h-auto w-full object-contain"
        priority
       />
      </div>
     </div>
    </div>

    <div className="lg:col-span-7">
     <p className="eyebrow">About</p>
     <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
      A little bit <span className="text-accent">about us.</span>
     </h1>
     <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">
      My name is Thomas Klein — a software engineer and product ownership partner for product
      owners and business founders. I would rather own a handful of custom products with you
      for years than ship a one-off project and disappear after launch.
     </p>
     <p className="mt-4 text-pretty text-[15px] leading-relaxed text-body sm:text-base">
      The work is mobile-led software people actually use, plus the systems and AI that make it
      real. When you email, you get the person who builds it.
     </p>
     <p className="mt-4 text-pretty text-[15px] leading-relaxed text-body sm:text-base">
      My wife Monisha and I take on a small number of ownership relationships at a time, on
      purpose. We are currently in the Philippines at IGSL — the International Graduate School
      of Leadership — training in biblical studies and discipleship. Client work carries on
      from here, on the same timelines as always.
     </p>

     <div className="mt-8 grid gap-4">
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
        product on a retainer), and Tap to Tick (personal iOS expense app). Proof of how I
        work — not products Kingdom Sites sells off the shelf.{' '}
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
        <span className="align-super text-[0.75em] text-accent">*</span> My time is the
        donation. The running costs — the domain name, hosting, and any outside service the
        site depends on — stay with you, billed to you directly.
       </p>
      </div>

      <div className="mt-2">
       <Link href={INQUIRE_PATH} className="btn-primary">{INQUIRE_CTA}</Link>
       <p className="mt-4 text-sm text-body">
        {'Or write directly — '}
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
     </div>
    </div>
   </div>
  </div>
 )
}
