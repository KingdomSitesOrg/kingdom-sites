import Image from 'next/image'
import type { Metadata } from 'next'
import aboutImage from '../../../public/Photos/about.jpg'
import ContactCta from '@/components/ContactCta'

export const metadata: Metadata = {
  title: 'About — Kingdom Sites',
  description: 'Meet Thomas Klein — the developer behind Kingdom Sites.',
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
            My name is Thomas Klein — a software developer passionate about building great products for great people.
            My wife Monisha and I love working directly with clients to understand their needs and deliver solutions that actually move the needle.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="tile p-6">
              <h2 className="text-sm font-semibold tracking-tight text-ink">What I focus on</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                Custom software for any project — websites, mobile apps, platforms, and everything in between. Fast, clean, and built to solve real problems, at competitive pricing with every engagement individually quoted.
              </p>
            </div>

            <div className="tile p-6">
              <h2 className="text-sm font-semibold tracking-tight text-ink">{'Why "Kingdom Sites"'}</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {"You're not just getting a product — you're getting a development partner who's invested in your success. I want to see your business thrive, and I believe great software can be the difference maker."}
              </p>
            </div>

            <div className="mt-2">
              <ContactCta label="Get a Quote" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
