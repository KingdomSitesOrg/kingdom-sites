import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import aboutImage from '../../../public/Photos/about.jpg'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'About — Kingdom Sites',
  description:
    'Meet Thomas Klein — the software engineer behind Kingdom Sites, working with small service businesses as a long-term partner rather than a one-off website vendor.',
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
            My name is Thomas Klein — a software engineer who would rather work with a handful of
            small business owners for years than sell a hundred websites once. Most of the people I
            work with run service businesses: pressure washing, window cleaning, landscaping. They
            are excellent at the job and were never meant to spend their evenings fighting with
            Google.
          </p>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-body sm:text-base">
            My wife Monisha and I take on a small number of these partnerships at a time, on purpose.
            When you call, you get the person who built it.
          </p>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-body sm:text-base">
            We are currently in the Philippines at IGSL — the International Graduate School of
            Leadership — training in biblical studies and discipleship. Client work carries on from
            here, on the same timelines as always.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="tile p-6">
              <h2 className="text-sm font-semibold tracking-tight text-ink">What I actually do for you</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {'Everything that gets a local business found and called: the website, the Google listing, the local search work, the photos, the reviews. One monthly fee, no build cost, and changes whenever you need them. '}
                <Link href="/local-business" className="link-accent">
                  See what is included <span aria-hidden="true">›</span>
                </Link>
              </p>
            </div>

            <div className="tile p-6">
              <h2 className="text-sm font-semibold tracking-tight text-ink">A partner, not a vendor</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {'A website handed over on launch day and never touched again is worth almost nothing — and it is what most owners have already paid for once. I would rather be the person still working on your business in year three, paid a little each month, with every reason to keep your phone ringing.'}
              </p>
            </div>

            <div className="tile p-6">
              <h2 className="text-sm font-semibold tracking-tight text-ink">
                I build serious software too
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {'Alongside this I build real products — including Ruta, the platform a landscaping company runs its whole operation on, and apps on the App Store. It is why I understand your trade, and why the technical side of your site is in good hands. '}
                <Link href="/my-work" className="link-accent">
                  My work <span aria-hidden="true">›</span>
                </Link>
              </p>
            </div>

            <div className="tile p-6">
              <h2 className="text-sm font-semibold tracking-tight text-ink">Free websites for ministries</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                Ministries, missionaries raising support, and churches get the site built for free
                <span className="align-super text-[0.6em] text-accent">*</span> — the same work a
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
              <Link href="/get-started" className="btn-primary">
                Get a free look at your business
              </Link>
              <p className="mt-4 text-sm text-body">
                {'Or just email me — '}
                <a href={CONTACT_MAILTO} className="link-accent">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
