import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import WarmChrome from '@/components/warm/Chrome'
import { CONTACT_EMAIL, CONTACT_MAILTO, INQUIRE_PATH } from '@/lib/contact'
import { PHOTOS } from '@/lib/work'

export const metadata: Metadata = {
  title: 'Our story',
  description: 'Thomas and Monisha Klein, the two people behind Kingdom Sites: who we are, how we work, and why ministries get their websites free.',
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <WarmChrome>
      <section aria-label="Our story" className="wm-wrap pb-16 pt-8 sm:pt-12">
        <p className="wm-eyebrow">Our story</p>
        <h1 className="wm-serif wm-h1 mt-4 max-w-[18ch]">Two people, a few projects at a time, on purpose.</h1>
        <figure className="mt-12">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[6px] sm:aspect-[2/1]">
            <Image src={PHOTOS.thomasMonisha.src} alt={PHOTOS.thomasMonisha.alt} fill priority unoptimized sizes="100vw" className="wm-photo object-[50%_35%]" />
          </div>
          <figcaption className="wm-cap">Thomas and Monisha Klein.</figcaption>
        </figure>
      </section>

      <section aria-labelledby="who" className="wm-wrap grid gap-10 pb-20 sm:pb-28 lg:grid-cols-12 lg:gap-12">
        <h2 id="who" className="wm-serif wm-h3 lg:col-span-4">Who you will be talking to</h2>
        <div className="space-y-5 text-[18px] lg:col-span-7">
          <p className="wm-ink">
            My name is Thomas Klein. I am a software engineer, and I design, build, launch and look after websites and apps
            for people with an idea and more to do after launch.
          </p>
          <p>
            I would rather stay with a handful of products for years than ship a one-off and disappear. So my wife Monisha
            and I take on a small number of projects at a time, on purpose. When you email, you get the person who builds
            it.
          </p>
          <p>
            We are currently in the Philippines at IGSL, the International Graduate School of Leadership, training in
            biblical studies and discipleship. Client work carries on from here, on the same timelines as always.
          </p>
        </div>
      </section>

      <section aria-labelledby="why" className="wm-band">
        <div className="wm-wrap grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[6px]">
              <Image src={PHOTOS.outdoors.src} alt={PHOTOS.outdoors.alt} fill unoptimized sizes="25vw" className="wm-photo" />
            </div>
            <div className="relative mt-12 aspect-[3/4] overflow-hidden rounded-[6px]">
              <Image src={PHOTOS.evening.src} alt={PHOTOS.evening.alt} fill unoptimized sizes="25vw" className="wm-photo" />
            </div>
          </div>
          <div>
            <h2 id="why" className="wm-serif wm-h2">Why ministries get their website free</h2>
            <p className="mt-6 text-[18px]">
              Ministries, missionaries raising support and churches get the same site every client gets, built and put live,
              for free. It is one of the ways this work goes toward the advance of the gospel rather than only toward a
              business.
            </p>
            <p className="mt-4 text-[18px]">
              The domain name, the hosting and any outside service the site depends on stay in your name and under your
              control. Part of what we earn goes to organizations serving the persecuted church.
            </p>
            <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/mission" className="wm-textlink">Our mission</Link>
              <Link href="/prayer" className="wm-textlink">The prayer site</Link>
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="work" className="wm-wrap grid gap-10 py-20 sm:py-28 lg:grid-cols-12 lg:gap-12">
        <h2 id="work" className="wm-serif wm-h3 lg:col-span-4">What I have built</h2>
        <ul className="space-y-6 lg:col-span-7">
          {[
            ['Farzana', 'Education software for schools, training organizations and education businesses.', 'https://farzana.app'],
            ['JAM Classes', 'JAM with Latin’s online school, the first one running on Farzana.', ''],
            ['Jam with Latin', 'A Latin learning game, on the App Store and Google Play.', '/latin-game'],
            ['Delta Development Project', 'The website for a project of SIM Bangladesh.', 'https://deltadevelopmentproject.com'],
            ['Ruta', 'Contract work on a live platform for landscaping businesses.', '/ruta'],
            ['Tap to Tick', 'An iPhone expense app: log a purchase in one tap.', '/tap-to-tick'],
          ].map(([name, line, href]) => (
            <li key={name} className="wm-rule pt-5">
              <p className="wm-serif text-[1.4rem] font-semibold">
                {href ? (
                  <a href={href} className="hover:text-[var(--clay)]">
                    {name} <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  name
                )}
              </p>
              <p className="mt-1">{line}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Talk with Thomas" className="wm-rule">
        <div className="wm-wrap py-24 text-center sm:py-32">
          <h2 className="wm-serif wm-h2 mx-auto max-w-[18ch]">Tell us what you have in mind.</h2>
          <p className="wm-lede mx-auto mt-5 max-w-[40ch]">
            Through the form, or straight to{' '}
            <a href={CONTACT_MAILTO} className="wm-textlink">{CONTACT_EMAIL}</a>.
          </p>
          <Link href={INQUIRE_PATH} className="wm-btn mt-9">
            Talk with Thomas <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </WarmChrome>
  )
}
