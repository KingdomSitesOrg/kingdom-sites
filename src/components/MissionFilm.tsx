'use client'

import { useEffect, useRef, useState } from 'react'
import { FILM_POSTER } from '@/lib/film-poster'

/* "Who Will Tell Them?" on the Mission page (T-379). Optional by design:
   nothing plays or loads until the visitor presses Play. Before that the page
   holds only the poster frame (sized copies from scripts/film-poster.mjs); the
   <video> is on the page with preload="none", so the browser asks for none of
   the film until play() is called. Close, or scrolling the film out of view,
   pauses it. The files live in public/mission/, as the site's other films live
   in public/<page>/; the phone copy is the smaller source for narrow screens. */
const FILM = '/mission/who-will-tell-them.mp4'
const FILM_PHONE = '/mission/who-will-tell-them-phone.mp4'
const SIZES = '(min-width: 1180px) 980px, calc(100vw - 32px)'

/* The triangle is drawn with its box centred in the icon; `nudge` then moves it
   right by a small share of its size, because a play triangle looks centred
   when its weight (a third of the way in from the flat edge) sits at the middle. */
function PlayIcon({ size, nudge = 0 }: { size: number; nudge?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginLeft: size * nudge }}>
      <path transform="translate(-2.75 0)" d="M8 5.2v13.6a1 1 0 0 0 1.52.85l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 8 5.2Z" />
    </svg>
  )
}

export default function MissionFilm() {
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  // `open`: the visitor pressed Play and the frame is showing the film.
  // `rolling`: the first frame is up, so the film may fade in over the poster.
  const [open, setOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [failed, setFailed] = useState(false)

  const play = () => {
    const video = videoRef.current
    if (!video) return
    setFailed(false)
    setOpen(true)
    // Called straight from the press, so phones allow sound.
    video.play().catch(() => {})
  }

  const close = () => {
    videoRef.current?.pause()
    setOpen(false)
    setRolling(false)
  }

  // Scrolling the film out of view pauses it; coming back leaves it paused.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !open) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) videoRef.current?.pause()
      },
      { threshold: 0.2 },
    )
    io.observe(frame)
    return () => io.disconnect()
  }, [open])

  const set = (ext: string) => FILM_POSTER.widths.map((w) => `/opt/${FILM_POSTER.name}-${w}.${ext} ${w}w`).join(', ')
  const mid = FILM_POSTER.widths[1]

  return (
    <section aria-label="Who Will Tell Them?, a short film" className="cn-wrap pb-12 pt-8 sm:pb-16 sm:pt-12">
      <div className="mx-auto max-w-[980px]">
        <div className="cn-browser" ref={frameRef}>
          <div className="cn-browser-bar">
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <span className="cn-browser-url" aria-hidden="true">Who Will Tell Them?</span>
          </div>

          <div className="relative aspect-video w-full bg-black">
            <picture>
              <source type="image/avif" srcSet={set('avif')} sizes={SIZES} />
              <source type="image/webp" srcSet={set('webp')} sizes={SIZES} />
              <img
                src={`/opt/${FILM_POSTER.name}-${mid}.jpg`}
                srcSet={set('jpg')}
                sizes={SIZES}
                alt="Two women and a child gathering rice in a Bangladeshi field"
                width={1600}
                height={900}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                style={{ backgroundColor: FILM_POSTER.tone, backgroundImage: `url(${FILM_POSTER.blur})`, backgroundSize: 'cover' }}
              />
            </picture>

            {/* Present from the start so Play can start it in the same press,
                but preload="none" keeps it from fetching anything until then. */}
            <video
              ref={videoRef}
              preload="none"
              playsInline
              controls={open}
              onPlaying={() => setRolling(true)}
              onError={() => {
                setOpen(false)
                setRolling(false)
                setFailed(true)
              }}
              className={`absolute inset-0 h-full w-full bg-black transition-opacity duration-500 ${
                rolling ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <source src={FILM_PHONE} type="video/mp4" media="(max-width: 640px)" />
              <source src={FILM} type="video/mp4" />
            </video>

            {!open ? (
              <button
                type="button"
                onClick={play}
                aria-label="Play the film, Who Will Tell Them?"
                className="group absolute inset-0 grid cursor-pointer place-items-center bg-[linear-gradient(to_bottom,rgba(11,11,12,0.1),rgba(11,11,12,0.4))] transition-colors hover:bg-[linear-gradient(to_bottom,rgba(11,11,12,0),rgba(11,11,12,0.3))]"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--fg)] text-[var(--bg)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20">
                  <PlayIcon size={28} nudge={0.115} />
                </span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="max-w-xl">
            <h2 className="cn-display cn-h3 text-balance">Who Will Tell Them?</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-body sm:text-base">
              {failed
                ? 'The film is not available right now. The page below reads the same without it.'
                : 'Bangladesh, and the people who have not yet heard. Watch it, or keep scrolling.'}
            </p>
          </div>
          {open ? (
            <button type="button" onClick={close} className="cn-ghost cursor-pointer">
              Close film
            </button>
          ) : (
            <button type="button" onClick={play} className="cn-btn cursor-pointer">
              <PlayIcon size={16} />
              Play the film
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
