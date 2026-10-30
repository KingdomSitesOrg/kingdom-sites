/**
 * The name on a work card, with its arrow (T-380). Every card, whether it links
 * to a page on this site or to another website, gets the same up-right arrow
 * (↗). It is one drawn shape, not a text glyph, so its size and weight match on
 * every card, and it stays on the last word of the name, so it never wraps onto
 * a line of its own.
 */
export default function CaseTitle({ name }: { name: string }) {
  const words = name.split(' ')
  const last = words.pop()
  return (
    <>
      {words.length ? `${words.join(' ')} ` : null}
      <span className="cn-nowrap">
        {last}
        <span aria-hidden="true" className="cn-arrow-wrap">
          <svg className="cn-arrow cn-arrow-up" viewBox="0 0 24 24" focusable="false">
            <path d="M3.5 12h16M13.5 5.5 20 12l-6.5 6.5" />
          </svg>
        </span>
      </span>
    </>
  )
}
