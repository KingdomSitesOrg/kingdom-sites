import Image from 'next/image'
import Link from 'next/link'
import CaseTitle from '@/components/cinematic/CaseTitle'
import { Browser } from '@/components/cinematic/Frames'
import Scroll from '@/components/cinematic/Scroll'
import type { CaseStudy as Study, Figure } from '@/lib/case-studies'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { breadcrumbLd, jsonLd } from '@/lib/seo'
import { PROJECTS } from '@/lib/work'

/* The facts beside a project, as on the Portfolio page. */
function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[15px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="cn-dim">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* A screen in the browser window, or one of the project's own photos in the
   card frame, then its name and a line. */
function Shown({ f }: { f: Figure }) {
  return (
    <figure>
      {f.product ? (
        <Browser shot={f.shot} product={f.product} note={f.note} />
      ) : (
        <span className="cn-shot">
          <Image src={f.shot.src} alt={f.shot.alt} width={f.shot.w} height={f.shot.h} loading="lazy" unoptimized />
        </span>
      )}
      <figcaption>
        <h3 className="cn-display cn-h3 mt-8">{f.title}</h3>
        <p className="cn-body mt-3 max-w-[40ch]">{f.caption}</p>
      </figcaption>
    </figure>
  )
}

/* One beat of the story: its name on the left, the words on the right, on a
   rule, as the home page's "What I make" rows. */
function Beat({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Scroll>
      <section className="cn-reveal grid gap-4 border-t border-[var(--line)] pt-6 lg:grid-cols-[1fr_1.4fr] lg:items-baseline">
        <h2 className="cn-display cn-h2">{title}</h2>
        <div className="cn-body max-w-[52ch] space-y-5">{children}</div>
      </section>
    </Scroll>
  )
}

/**
 * A project's own page (T-389): the name and its facts, the main screen lying
 * back and standing up as you scroll (as on the Portfolio page), then the
 * same five beats on every page (Thomas, T-389): the problem, what I built,
 * how long it took, what improved after launch and what the client says. A
 * beat with no confirmed answer is left out, never guessed. Then more screens,
 * related work, and the closing call. Its structured data and breadcrumb go in the page.
 */
export default function CaseStudy({ study, data }: { study: Study; data: object }) {
  const related = study.related.map((slug) => PROJECTS.find((p) => p.slug === slug)!)
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd(study.name, study.path)) }} />

      <Scroll mode="sticky" className="cn-hero">
        <div className="cn-wrap pt-16 sm:pt-24">
          <p className="cn-kicker cn-rise">
            <Link href="/portfolio" className="hover:text-[var(--fg)]">
              Portfolio
            </Link>{' '}
            · {study.kind}
          </p>
          <h1 className="cn-display cn-h2 cn-rise cn-rise-2 mt-5 text-balance">{study.name}</h1>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="cn-body cn-rise cn-rise-3 max-w-[48ch]">{study.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={study.site.href} target="_blank" rel="noopener noreferrer" className="cn-ghost">
                  {study.site.label} <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <Facts rows={study.facts} />
          </div>
        </div>
        <Scroll prop="--q" className="cn-wrap cn-stage mt-14 pb-20 sm:mt-20 sm:pb-28">
          <div className={`cn-tilt mx-auto ${study.hero.shot.w < 1200 ? 'max-w-[960px]' : 'max-w-[1180px]'}`}>
            <Browser shot={study.hero.shot} product={study.hero.product!} note={study.hero.note} priority />
          </div>
        </Scroll>
      </Scroll>

      <div className="cn-wrap space-y-16 sm:space-y-24">
        <Beat title="The problem">
          {study.problem.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Beat>
        <Beat title="What I built">
          <p className="text-[var(--fg)]">{study.built.lead}</p>
          <ul className="space-y-2.5">
            {study.built.list.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed sm:text-base">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fg)]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Beat>
        {study.took ? (
          <Beat title={study.took.title ?? 'How long it took'}>
            {study.took.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Beat>
        ) : null}
        {study.result ? (
          <Beat title="What improved after launch">
            {study.result.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p>
              <a href={study.site.href} target="_blank" rel="noopener noreferrer" className="text-[var(--fg)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-current">
                Open {study.site.label}
              </a>
            </p>
          </Beat>
        ) : null}
        {study.quote ? (
          <Beat title="What the client says">
            <figure>
              <blockquote className="cn-display cn-h3 text-[var(--fg)]">“{study.quote.text}”</blockquote>
              <figcaption className="cn-dim mt-5 text-[15px]">{study.quote.who}</figcaption>
            </figure>
          </Beat>
        ) : null}
      </div>

      <div className={`cn-wrap mt-24 grid gap-14 sm:mt-32 ${study.figures.length > 1 ? 'lg:grid-cols-2 lg:gap-10' : ''}`}>
        {study.figures.map((f, i) => (
          <Scroll key={f.shot.src}>
            <div className={`cn-reveal ${study.figures.length > 1 && i % 2 ? 'lg:mt-32' : 'mx-auto max-w-[1180px]'}`}>
              <Shown f={f} />
            </div>
          </Scroll>
        ))}
      </div>

      {/* Related work, in the home page's card style. */}
      <section aria-labelledby="related" className="cn-wrap mt-32 sm:mt-44">
        <h2 id="related" className="cn-kicker">
          More from my portfolio
        </h2>
        <div className="mt-8 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {related.map((p) => (
            <Scroll key={p.slug} className="flex">
              <Link href={p.href!} className="cn-reveal cn-card group block">
                <p className="cn-dim text-sm">
                  {p.kind} · {p.forWhom}
                </p>
                <h3 className="cn-display cn-h3 cn-case-name mt-2">
                  <CaseTitle name={p.name} />
                </h3>
                <p className="cn-body cn-case-line mt-3 text-[1.02rem]">{p.line}</p>
              </Link>
            </Scroll>
          ))}
        </div>
        <p className="mt-12">
          <Link href="/portfolio" className="cn-ghost">
            The whole portfolio <span aria-hidden="true">→</span>
          </Link>
        </p>
      </section>

      <section aria-label="Start a conversation" className="cn-wrap pb-28 pt-36 text-center sm:pb-40 sm:pt-48">
        <h2 className="cn-display cn-h1 mx-auto max-w-[12ch]">Yours could be next.</h2>
        <p className="cn-body mx-auto mt-6 max-w-[40ch]">
          Tell me what you have in mind. You talk to me, Thomas, the person who will build it, and you get a plan and a quote once I
          understand it.
        </p>
        <Link href={INQUIRE_PATH} className="cn-btn mt-10">
          {INQUIRE_CTA} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </article>
  )
}
