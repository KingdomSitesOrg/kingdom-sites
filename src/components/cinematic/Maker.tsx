import { MADE, type Made } from '@/lib/work'
import Scroll from './Scroll'

type Key = keyof typeof MADE

/**
 * The maker's credit (T-372): what I made, and what it does for the people
 * who use it. With a `title`, it is the page's one big beat ("What I built",
 * once, after the first product); without one, just the two credit lines.
 */
export function Credit({ id, title }: { id: Key; title?: string }) {
  const m: Made = MADE[id]
  return (
    <Scroll className="cn-wrap">
      <div className={`cn-reveal cn-credit${title ? '' : ' cn-credit-sm'}`}>
        {title ? <p className="cn-display cn-h2">{title}</p> : null}
        {m.text ? (
          <p className="cn-credit-text">{m.text}</p>
        ) : (
          <dl className="cn-credit-list">
            <div>
              <dt>What I made</dt>
              <dd>{m.made}</dd>
            </div>
            <div>
              <dt>What it does for them</dt>
              <dd>{m.gives}</dd>
            </div>
          </dl>
        )}
      </div>
    </Scroll>
  )
}
