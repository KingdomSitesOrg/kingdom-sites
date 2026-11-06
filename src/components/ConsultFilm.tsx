'use client'

import { useEffect, useRef, useState } from 'react'
import { CONSULT_FILM_POSTER } from '@/lib/consult-film-poster'
import { AI_CONSULT } from '@/lib/partnership'

/* The AI consultation film on /ai-tooling: 80 seconds on what AI takes off a
   team, made in Remotion (film/ai-productivity on the film branch). Built like
   the Mission page's film (MissionFilm.tsx): nothing loads until the visitor
   presses Play. Before that the page holds only the poster, the film's title
   card, in sized copies; the <video> has preload="none". Scrolling it out of
   view pauses it. The phone copy (720p) is the smaller file for narrow
   screens. Captions come from the narration's word timings and are off until
   the visitor turns them on in the player. */
const FILM = '/ai-consultation/ai-consultation-film.mp4'
const FILM_PHONE = '/ai-consultation/ai-consultation-film-phone.mp4'
const CAPTIONS = '/ai-consultation/ai-consultation-film.vtt'
const SIZES = '(min-width: 1180px) 980px, calc(100vw - 32px)'

/* The triangle's box is centred; `nudge` moves it right a little, because a
   play triangle looks centred when its weight sits at the middle. */
function PlayIcon({ size, nudge = 0 }: { size: number; nudge?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginLeft: size * nudge }}>
      <path transform="translate(-2.75 0)" d="M8 5.2v13.6a1 1 0 0 0 1.52.85l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 8 5.2Z" />
    </svg>
  )
}

export default function ConsultFilm() {
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  // `open`: the visitor pressed Play. `rolling`: the first frame is up, so the
  // film may fade in over the poster.
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

  const P = CONSULT_FILM_POSTER
  const set = (ext: string) => P.widths.map((w) => `/opt/${P.name}-${w}.${ext} ${w}w`).join(', ')

  return (
    <section aria-label={`${AI_CONSULT.filmTitle} A short film.`} className="cn-wrap pb-8 pt-4 sm:pb-12 sm:pt-8">
      <div className="mx-auto max-w-[980px]">
        <div className="cn-browser" ref={frameRef}>
          <div className="cn-browser-bar">
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <span className="cn-browser-url" aria-hidden="true">AI at work</span>
          </div>

          <div className="relative aspect-video w-full" style={{ backgroundColor: P.tone }}>
            <picture>
              <source type="image/avif" srcSet={set('avif')} sizes={SIZES} />
              <source type="image/webp" srcSet={set('webp')} sizes={SIZES} />
              <img
                src={`/opt/${P.name}-${P.widths[1]}.jpg`}
                srcSet={set('jpg')}
                sizes={SIZES}
                alt="The film's title card: What if AI did the busywork, and your people did the thinking?"
                width={1200}
                height={675}
                loading="lazy"
                decoding="async"
                className="block h-full w-full"
                style={{ backgroundColor: P.tone, backgroundImage: `url(${P.blur})`, backgroundSize: 'cover' }}
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
              className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
                rolling ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              style={{ backgroundColor: P.tone }}
            >
              <source src={FILM_PHONE} type="video/mp4" media="(max-width: 640px)" />
              <source src={FILM} type="video/mp4" />
              <track kind="captions" src={CAPTIONS} srcLang="en" label="English" />
            </video>

            {!open ? (
              <button
                type="button"
                onClick={play}
                aria-label="Play the AI consultation film"
                className="group absolute inset-0 grid cursor-pointer place-items-end justify-center pb-[5%] transition-colors hover:bg-[rgba(11,11,12,0.03)] sm:pb-[9%]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#1b1b1e] text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20">
                  <PlayIcon size={24} nudge={0.115} />
                </span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="max-w-xl">
            <p className="cn-kicker">{AI_CONSULT.filmKicker}</p>
            <h2 className="cn-display cn-h3 mt-3 text-balance">{AI_CONSULT.filmTitle}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-body sm:text-base">
              {failed ? 'The film is not available right now. The rest of the page reads the same without it.' : AI_CONSULT.filmBody}
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
