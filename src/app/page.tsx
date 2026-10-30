import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import WarmChrome from '@/components/warm/Chrome'
import { INQUIRE_PATH } from '@/lib/contact'
import { OFFER, PHOTOS, SHOTS, STEPS, type Shot } from '@/lib/work'

export const metadata: Metadata = {
  title: 'Kingdom Sites — websites and apps for churches, ministries and schools',
  description:
    'Thomas and Monisha Klein build websites and iPhone and Android apps for churches, ministries, schools and small businesses. Websites for ministries are free.',
  alternates: { canonical: '/' },
}

/* A photograph that fills its box; the box sets the shape. */
function Photo({ shot, className, priority, sizes }: { shot: Shot; className?: string; priority?: boolean; sizes?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[6px] ${className ?? ''}`}>
      <Image src={shot.src} alt={shot.alt} fill sizes={sizes ?? '50vw'} priority={priority} unoptimized className="wm-photo" />
    </div>
  )
}

function Plain({ shot, className }: { shot: Shot; className: string }) {
  return <Image src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} unoptimized className={className} />
}

export default function Home() {
  return (
    <WarmChrome>
      {/* Hero: who we are, with our faces. */}
      <section aria-label="Kingdom Sites" className="wm-wrap pb-20 pt-8 sm:pb-28 sm:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="wm-in">
            <p className="wm-eyebrow">Kingdom Sites</p>
            <h1 className="wm-serif wm-h1 mt-4">Websites and apps for churches, ministries and schools.</h1>
            <p className="wm-lede mt-7 max-w-[34ch]">
              We are Thomas and Monisha Klein. Thomas designs and builds every site and app himself. We take on a few
              projects at a time, on purpose, and we stay after launch.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href={INQUIRE_PATH} className="wm-btn">
                Talk with Thomas <span aria-hidden="true">→</span>
              </Link>
              <a href="#stories" className="wm-quiet">
                See who we build for
              </a>
            </div>
            <p className="mt-10 max-w-[40ch] border-l-2 border-[var(--olive)] pl-4 text-[15px]">
              <span className="wm-ink font-semibold">Serving a church or ministry?</span> Your website is free.{' '}
              <a href="#ministries" className="wm-textlink">How that works</a>
            </p>
          </div>
          <figure className="wm-in wm-in-2">
            <Photo shot={PHOTOS.outdoors} className="aspect-[4/5] w-full" priority sizes="(min-width: 1024px) 40vw, 100vw" />
            <figcaption className="wm-cap">Thomas and Monisha.</figcaption>
          </figure>
        </div>
      </section>

      {/* Stories: the people we build for, with their own pictures. */}
      <section id="stories" aria-labelledby="stories-h" className="wm-rule scroll-mt-4">
        <div className="wm-wrap py-20 sm:py-28">
          <p className="wm-eyebrow">The people we build for</p>
          <h2 id="stories-h" className="wm-serif wm-h2 mt-3 max-w-[20ch]">Real work, for people doing real work.</h2>

          {/* Delta */}
          <article className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-12 sm:mt-20">
            <div className="lg:col-span-7">
              <Photo shot={PHOTOS.deltaSchool} className="aspect-[3/2] w-full" sizes="(min-width: 1024px) 58vw, 100vw" />
            </div>
            <div className="lg:col-span-5 lg:pt-6">
              <p className="wm-eyebrow">Delta Development Project · a project of SIM Bangladesh</p>
              <h3 className="wm-serif wm-h3 mt-3">Village schools in Bangladesh, told plainly.</h3>
              <p className="mt-4">
                Delta works with river-bank and urban communities in northern Bangladesh and Dhaka: village schools from
                pre-primary to class 2, training in tailoring and trades, and food and shelter when the floods come. Their
                website tells that work plainly, in their own pictures.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Photo shot={PHOTOS.deltaTailoring} className="aspect-[4/5]" sizes="20vw" />
                <Photo shot={PHOTOS.deltaRelief} className="aspect-[4/5]" sizes="20vw" />
              </div>
              <a href="https://deltadevelopmentproject.com" className="wm-textlink mt-6 inline-block" target="_blank" rel="noreferrer">
                deltadevelopmentproject.com ↗
              </a>
            </div>
          </article>

          {/* JAM with Latin */}
          <article className="mt-24 grid items-center gap-10 lg:grid-cols-12 lg:gap-12 sm:mt-32">
            <div className="lg:order-2 lg:col-span-7">
              <div className="relative">
                <Plain shot={SHOTS.jamClass} className="wm-screen" />
                <div className="absolute -bottom-10 right-4 w-[24%] sm:right-8">
                  <Plain shot={SHOTS.latinHome} className="wm-phone" />
                </div>
              </div>
            </div>
            <div className="mt-6 lg:order-1 lg:col-span-5 lg:mt-0">
              <p className="wm-eyebrow">JAM with Latin</p>
              <h3 className="wm-serif wm-h3 mt-3">Latin classes, online and in students’ pockets.</h3>
              <p className="mt-4">
                JAM with Latin teaches Latin. Its classes, flashcards and workbooks now live online in JAM Classes, the
                first school on Farzana, our platform for schools. Its students also play Jam with Latin, the game we made
                for iPhone and Android.
              </p>
              <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                <a href="https://farzana.app" className="wm-textlink">About Farzana ↗</a>
                <Link href="/latin-game" className="wm-textlink">The Latin game</Link>
              </p>
            </div>
          </article>

          {/* Prayer */}
          <article className="mt-28 grid items-center gap-10 lg:grid-cols-12 lg:gap-12 sm:mt-36">
            <div className="lg:col-span-7">
              <Photo shot={{ src: '/prayer/field.jpg', alt: 'A field under a heavy sky', w: 1600, h: 1066 }} className="aspect-[3/2] w-full" sizes="(min-width: 1024px) 58vw, 100vw" />
            </div>
            <div className="lg:col-span-5">
              <p className="wm-eyebrow">Prayer, for churches and small groups</p>
              <h3 className="wm-serif wm-h3 mt-3">A weekly prayer meeting, ready to run.</h3>
              <p className="mt-4">
                “How will they hear if no one tells them?” Our prayer site is a simple kit for a weekly meeting for the
                unreached: a verse, a story, prayer points, and free guides a group can download and use.
              </p>
              <Link href="/prayer" className="wm-textlink mt-6 inline-block">Open the prayer site</Link>
            </div>
          </article>
        </div>
      </section>

      {/* Free for ministries. */}
      <section id="ministries" aria-labelledby="min-h" className="wm-band scroll-mt-4">
        <div className="wm-wrap grid gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="wm-eyebrow">For ministries</p>
            <h2 id="min-h" className="wm-serif wm-h2 mt-3">If you serve a church or a ministry, your website is free.</h2>
            <p className="wm-lede mt-6 max-w-[38ch]">
              It is one of the ways this business goes toward the advance of the gospel, and not only toward a business.
            </p>
            <Link href={INQUIRE_PATH} className="wm-btn mt-9">
              Ask for a ministry site <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className="space-y-6 self-end text-[17px]">
            {[
              ['For ministries, missionaries raising support, and churches.', ''],
              ['Built and put live the same way as any client’s site.', ''],
              ['The domain name and hosting stay in your name, under your control.', ''],
              ['Part of what we earn goes to organizations serving the persecuted church.', '/mission'],
            ].map(([t, href]) => (
              <li key={t} className="wm-check wm-ink">
                <span>
                  {t}{' '}
                  {href ? (
                    <Link href={href} className="wm-textlink">Which ones</Link>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What we build. */}
      <section aria-labelledby="build-h" className="wm-wrap py-20 sm:py-28">
        <p className="wm-eyebrow">What we build</p>
        <h2 id="build-h" className="wm-serif wm-h2 mt-3 max-w-[22ch]">For schools and small businesses too.</h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {OFFER.map((o) => (
            <div key={o.title} className="wm-rule pt-5">
              <h3 className="wm-serif wm-h3">{o.title}</h3>
              <p className="mt-3">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A note from Thomas. */}
      <section aria-labelledby="note-h" className="wm-rule">
        <div className="wm-wrap grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16">
          <Photo shot={PHOTOS.thomasMonisha} className="aspect-[4/3] w-full" sizes="(min-width: 1024px) 45vw, 100vw" />
          <div>
            <h2 id="note-h" className="wm-eyebrow">A note from Thomas</h2>
            <blockquote className="wm-serif mt-5 text-[clamp(1.5rem,2.4vw,2.1rem)] leading-snug tracking-tight">
              “When you email, you get the person who builds it. I would rather stay with a handful of products for years
              than ship a one-off and disappear.”
            </blockquote>
            <p className="mt-6">
              Monisha and I are currently in the Philippines, at IGSL, the International Graduate School of Leadership,
              training in biblical studies and discipleship. The work carries on from here, on the same timelines.
            </p>
            <Link href="/about" className="wm-textlink mt-6 inline-block">Our story</Link>
          </div>
        </div>
      </section>

      {/* How it works. */}
      <section aria-labelledby="how-h" className="wm-band">
        <div className="wm-wrap py-20 sm:py-28">
          <p className="wm-eyebrow">How it works</p>
          <h2 id="how-h" className="wm-serif wm-h2 mt-3">Simple, personal, no pressure.</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="wm-serif text-[2.6rem] italic leading-none text-[var(--clay)]" aria-hidden="true">
                  {i + 1}.
                </span>
                <h3 className="wm-serif mt-3 text-[1.3rem] font-semibold leading-snug">{s.title}</h3>
                <p className="mt-2 text-[16px]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Close. */}
      <section aria-label="Talk with Thomas" className="wm-wrap py-24 text-center sm:py-32">
        <h2 className="wm-serif wm-h1 mx-auto max-w-[16ch]">Tell us about the work you are doing.</h2>
        <p className="wm-lede mx-auto mt-6 max-w-[40ch]">A few lines is plenty. Thomas reads every note and replies himself.</p>
        <Link href={INQUIRE_PATH} className="wm-btn mt-9">
          Talk with Thomas <span aria-hidden="true">→</span>
        </Link>
      </section>
    </WarmChrome>
  )
}
