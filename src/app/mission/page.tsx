import Image from 'next/image'
import type { Metadata } from 'next'
import southasiaImage from '../../../public/Photos/southasia.jpg'
import ContactCta from '@/components/ContactCta'

export const metadata: Metadata = {
  title: 'Our Mission — Kingdom Sites',
  description:
    'How your project supports gospel work in South Asia — and who I build software for: small businesses, agencies, non-profits, and growing teams.',
  alternates: { canonical: '/mission' },
}

/* Moved here from the old "Why Kingdom Sites" page: the kinds of client I work
   with, which belongs beside why the work exists. */
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
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="relative mx-auto w-full max-w-md">
            <div className="tile-elevated">
              <Image
                src={southasiaImage}
                alt="South Asia mission work"
                quality={75}
                placeholder="blur"
                className="aspect-auto w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <p className="eyebrow">Our mission work</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Mission work <span className="text-accent">around the world.</span>
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg">
            {"In South Asia, 1.8 billion people have never heard the gospel. Our desire is to see Jesus glorified throughout South Asia. For security reasons I can't share specific details, but please reach out if you have any questions."}
          </p>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-body">
            <p>
              We collaborate with Christians toward seeing movements of Christ among Muslim-majority people groups in South Asia, using approaches from No Place Left.
            </p>
            <p>
              Your project fuels long-term mission work among people with little access to the gospel. My wife and I are in training for long-term ministry in South Asia.
            </p>
          </div>

          <div className="mt-8">
            <ContactCta label="Start a Project" />
          </div>
        </div>
      </div>

      {/* What the work is, in a bit more detail. */}
      <div className="mt-16 border-t border-line pt-14 sm:mt-20 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow eyebrow-blue">Why this exists</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            The software pays for the mission.
          </h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-body sm:text-base">
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
              If you want to know more about the mission side, ask — some details I keep off a public
              page for security reasons, but I am glad to talk about it directly.
            </p>
          </div>

          <div className="mt-10">
            <h3 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Who I work with
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-body">
              Businesses and organizations of any size, on any project.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {WHO.map((item) => (
                <div key={item.title} className="tile p-6">
                  <h4 className="text-base font-semibold tracking-tight text-ink">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-body">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <ContactCta label="Email me about your project" />
          </div>
        </div>
      </div>
    </div>
  )
}
