'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { play, setSound, soundOn, watchSound } from '../_lib/sound'

/* The page's small reactions, in one place:
   - things rise into place as they scroll into view;
   - anything marked data-snap answers a press with a click sound and a few
     tiles flying off;
   - the row of tiles under the header fills as the page is read;
   - the Sound switch.
   It draws the header's right-hand side (the switch) and the progress row. */

const CHIP = ['#F2581C', '#2A5CFF', '#F7F5F0', '#8E929A']

function burst(x: number, y: number) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  for (let i = 0; i < 6; i++) {
    const bit = document.createElement('i')
    const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.9
    const far = 18 + Math.random() * 22
    bit.className = 'mu-bit'
    bit.style.left = `${x - 3}px`
    bit.style.top = `${y - 3}px`
    bit.style.background = CHIP[i % CHIP.length]
    document.body.appendChild(bit)
    bit
      .animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(angle) * far}px, ${Math.sin(angle) * far}px) rotate(90deg)`, opacity: 1, offset: 0.7 },
          { transform: `translate(${Math.cos(angle) * far}px, ${Math.sin(angle) * far + 8}px) rotate(90deg)`, opacity: 0 },
        ],
        { duration: 340, easing: 'cubic-bezier(.2,.8,.3,1)' },
      )
      .finished.finally(() => bit.remove())
  }
}

export default function Fx() {
  const fillRef = useRef<HTMLElement>(null)
  // On unless the visitor switched it off before (kept in the browser).
  const sound = useSyncExternalStore(watchSound, soundOn, () => true)

  useEffect(() => {
    const html = document.documentElement
    const root = document.querySelector('.mu')
    html.classList.add('mu-html')
    root?.classList.add('mu-js')

    // Rise into place, once, as each piece comes into view.
    const rise = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          rise.unobserve(entry.target)
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' },
    )
    document.querySelectorAll('.mu [data-rise]').forEach((el) => rise.observe(el))

    // A press on anything marked data-snap. A mouse press sounds at once; a
    // finger sounds on the tap itself, which is when phones allow sound.
    let mouse = true
    const onDown = (e: PointerEvent) => {
      mouse = e.pointerType === 'mouse'
      const hit = (e.target as Element).closest?.('.mu [data-snap]')
      if (!hit) return
      burst(e.clientX, e.clientY)
      if (mouse) play('tick')
    }
    const onClick = (e: MouseEvent) => {
      if (mouse) return
      if ((e.target as Element).closest?.('.mu [data-snap]')) play('tick')
    }

    // The progress row fills a whole tile at a time.
    let queued = 0
    const progress = () => {
      queued = 0
      const fill = fillRef.current
      const track = fill?.parentElement
      if (!fill || !track) return
      const room = document.documentElement.scrollHeight - window.innerHeight
      const done = room > 0 ? Math.min(1, window.scrollY / room) : 0
      fill.style.width = `${Math.round((done * track.clientWidth) / 8) * 8}px`
    }
    const onScroll = () => {
      if (!queued) queued = requestAnimationFrame(progress)
    }
    progress()

    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('click', onClick)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      html.classList.remove('mu-html')
      rise.disconnect()
      cancelAnimationFrame(queued)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <>
      <button
        type="button"
        className="mu-sound"
        aria-pressed={sound}
        data-snap
        onClick={() => setSound(!sound)}
      >
        <span className="mu-sound-label">Sound</span>
        <span className="mu-sound-track" aria-hidden="true">
          <i />
        </span>
      </button>
      <span className="mu-progress" aria-hidden="true">
        <i ref={fillRef} />
      </span>
    </>
  )
}
