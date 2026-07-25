'use client'

import { useEffect, useRef } from 'react'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function RevealCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal()
  return (
    <div
      ref={ref}
      className={`reveal-card tile w-full p-4 sm:p-6 lg:p-8 ${className}`}
      style={{ transitionDelay: `${delay}ms`, boxSizing: 'border-box' }}
    >
      {children}
    </div>
  )
}

function StatCard({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useReveal()
  return (
    <div
      ref={ref}
      className="reveal-card tile w-full p-6 text-center sm:p-8"
      style={{ transitionDelay: `${delay}ms`, boxSizing: 'border-box' }}
    >
      <p className="text-3xl font-semibold tracking-tight text-accent sm:text-4xl">{value}</p>
      <p className="mt-2 text-sm font-medium leading-snug text-body sm:text-base">{label}</p>
    </div>
  )
}

export default function WhyUs() {
  const heroRef = useRef<HTMLElement>(null)
  const heroInnerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = heroRef.current
    const inner = heroInnerRef.current
    if (!section || !inner) return
    const update = () => {
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const entry = Math.max(0, Math.min(1, (vh - rect.top) / vh))
      inner.style.transform = `translateY(${(1 - entry) * 50}px)`
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section ref={heroRef} className="hero-wash mx-auto max-w-6xl px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24">
        <div ref={heroInnerRef} style={{ willChange: 'transform' }}>
          <p className="eyebrow">Why Kingdom Sites</p>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Software that works <span className="text-accent">as hard as you do.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-body sm:mt-5 sm:text-base">
            Whether it is a website, mobile app, or custom platform — I scope every project individually and quote based on what you actually need.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8 sm:pb-16 lg:pb-20">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard value="Custom"     label="every project scoped and quoted to your needs"     delay={0}   />
          <StatCard value="Full stack" label="websites, mobile apps, platforms, APIs and more"   delay={80}  />
          <StatCard value="100%"       label="focused on solutions that drive real results"      delay={160} />
        </div>
      </section>

      {/* Why quality matters */}
      <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8 sm:pb-16 lg:pb-20">
        <RevealCard>
          <h2 className="mb-3 text-xl font-semibold tracking-tight text-ink sm:mb-4 sm:text-2xl lg:text-3xl">
            Why quality software matters for your business.
          </h2>
          <p className="mb-3 text-base leading-relaxed text-body">
            {"Most business websites and tools were built years ago, load slowly, and look dated on mobile. That matters — potential customers judge your credibility in seconds. If your site doesn't clearly communicate what you do and how to work with you, they'll move on."}
          </p>
          <p className="text-base leading-relaxed text-body">
            Well-built software communicates that your business is professional, organized, and ready to serve.
            It removes friction for potential customers, makes key info instantly findable, and drives real results.
          </p>
        </RevealCard>
      </section>

      {/* Unique position */}
      <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8 sm:pb-16 lg:pb-20">
        <RevealCard delay={0}>
          <p className="mb-2 eyebrow eyebrow-blue">The Kingdom Sites difference</p>
          <h3 className="mb-3 text-lg font-semibold tracking-tight text-ink sm:text-xl">
            A true development partner, not a vendor.
          </h3>
          <p className="text-base leading-relaxed text-body">
            I take the time to understand your goals and scope every project individually.
            You get a competitive custom quote based on exactly what you need — no bloated
            packages, no inflated agency rates, no surprises. Just thoughtful software built
            to serve your goals.
          </p>
        </RevealCard>
      </section>

      {/* Who we work with */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-24 lg:pb-28">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl lg:text-3xl">Who I work with.</h2>
          <p className="mt-2 text-sm leading-relaxed text-body sm:mt-3">
            I partner with businesses and organizations of all sizes — on any project.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Small businesses',
              desc: 'From local shops to growing startups — I build software that helps you operate more efficiently and reach more customers.',
            },
            {
              title: 'Agencies',
              desc: 'Need a trusted dev partner for client work? I offer white label development with the same quality and process as my direct projects.',
            },
            {
              title: 'Non-profits and organizations',
              desc: 'I love working with mission-driven organizations that need reliable, well-built software at a fair, competitive rate.',
            },
            {
              title: 'Growing teams',
              desc: "If you need custom tools, mobile apps, dashboards, or platforms to scale your operations, I'd love to build something great for you.",
            },
          ].map((item, i) => (
            <RevealCard key={item.title} delay={i * 90}>
              <h3 className="mb-2 text-sm font-semibold tracking-tight text-ink">{item.title}</h3>
              <p className="text-base leading-relaxed text-body">{item.desc}</p>
            </RevealCard>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a href={CONTACT_MAILTO} className="btn-primary">Email me</a>
          <p className="mt-4 text-sm text-body">
            <a href={CONTACT_MAILTO} className="link-accent">{CONTACT_EMAIL}</a>
          </p>
        </div>
      </section>
    </div>
  )
}
