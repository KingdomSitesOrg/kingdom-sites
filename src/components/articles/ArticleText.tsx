import Link from 'next/link'
import { Fragment } from 'react'

/* An article's text with its [words](/path) links made real: links on this site
   stay in the tab, sources open in a new one. */
export default function ArticleText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
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
