import ArticleText from '@/components/articles/ArticleText'

/* Someone's own words, set apart from the article as a card (T-403): the
   site's dark surface with a gold edge, the words large, who said it in gold
   underneath. Used for a quote in an article that ends with a "— name" line. */
const GOLD = '#c9b48a'

export default function QuoteCard({ text, cite }: { text: string; cite: string }) {
  return (
    <figure
      className="my-4 rounded-[16px] border border-[#c9b48a]/25 border-l-[4px] bg-surface-2 px-6 py-6 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)] sm:px-8 sm:py-7"
      style={{ borderLeftColor: GOLD }}
    >
      <blockquote className="text-pretty text-[19px] font-medium leading-[1.55] text-ink sm:text-[21px]">
        <ArticleText text={text} />
      </blockquote>
      <figcaption className="mt-4 text-[15px] font-medium tracking-wide" style={{ color: GOLD }}>
        — {cite}
      </figcaption>
    </figure>
  )
}
