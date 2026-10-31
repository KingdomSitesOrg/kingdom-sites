import Link from 'next/link'
import { Fragment } from 'react'

/* An article's text with its [words](/path) links made real (links on this site
   stay in the tab, sources open in a new one) and its **bold words** in bold. */
export default function ArticleText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*([^*]+)\*\*$/)
        if (bold) {
          return (
            <strong key={i} className="font-semibold text-ink">
              <ArticleText text={bold[1]} />
            </strong>
          )
        }
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (!m) return <Fragment key={i}>{part}</Fragment>
        const [, words, href] = m
        return href.startsWith('/') ? (
          <Link key={i} href={href} className="link-accent">
            {words}
          </Link>
        ) : (
          <a key={i} href={href} className="link-accent" target="_blank" rel="noopener noreferrer">
            {words}
          </a>
        )
      })}
    </>
  )
}
