import Link from 'next/link'

/* Who wrote the guide: Thomas, with the About page's own words. */
export default function AuthorBox() {
  return (
    <aside aria-label="About the author" className="tile mx-auto mt-16 max-w-2xl p-6 sm:p-8">
      <p className="cn-kicker">Written by</p>
      <p className="mt-3 text-lg font-semibold tracking-tight text-ink">Thomas Klein</p>
      <p className="text-sm text-muted">Kingdom Sites · Rochester, Minnesota</p>
      <p className="mt-4 text-pretty text-[15px] leading-relaxed text-body">
        I make software people actually use: websites, apps and the systems behind them. When you write to me,
        you get me, the person who builds it.
      </p>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/about" className="link-accent">
          About me <span aria-hidden="true">›</span>
        </Link>
        <Link href="/portfolio" className="link-accent">
          Portfolio <span aria-hidden="true">›</span>
        </Link>
      </p>
    </aside>
  )
}
