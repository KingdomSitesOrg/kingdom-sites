import { MADE, type Made } from '@/lib/work'
import Scroll from './Scroll'

type Key = keyof typeof MADE

/**
 * The maker's credit (T-372): the page's one big beat ("What I built"), then
 * a line on what the maker built.
 */
export function Credit({ id, title }: { id: Key; title: string }) {
  const m: Made = MADE[id]
  return (
    <Scroll className="cn-wrap">
      <div className="cn-reveal cn-credit">
        <p className="cn-display cn-h2">{title}</p>
        <p className="cn-credit-text">{m.text}</p>
      </div>
    </Scroll>
  )
}
