'use client'

import { useEffect, useRef, useState } from 'react'

export type LanguageCode = 'en' | 'bn'

export type MinistryVideo = {
  /** Language of this cut of the video. */
  code: LanguageCode
  /** How the language names itself, e.g. "বাংলা". */
  nativeLabel: string
  /** How the language is named in English, e.g. "Bangla". */
  englishLabel: string
  /** The book title as it appears on screen in that language. */
  title: string
  subtitle: string
  src: string
  poster: string
  /** Running time, already formatted for display. */
  length: string
}

/**
 * The video block: one player, with a pill for each language. Switching
 * language swaps the file and starts it from the top, so a visitor who
 * prefers Bangla can watch the same teaching without hunting for it.
 */
export default function MinistryPlayer({
  videos,
  bengaliFontClass = '',
}: {
  videos: MinistryVideo[]
  bengaliFontClass?: string
}) {
  const [active, setActive] = useState<LanguageCode>(videos[0].code)
  const videoRef = useRef<HTMLVideoElement>(null)
  // Only autoplay after the visitor has already chosen to play something —
  // never on first load.
  const hasPlayed = useRef(false)

  const current = videos.find((v) => v.code === active) ?? videos[0]

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.load()
    if (hasPlayed.current) video.play().catch(() => {})
  }, [active])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choose a language">
        {videos.map((v) => {
          const selected = v.code === active
          return (
            <button
              key={v.code}
              type="button"
              onClick={() => setActive(v.code)}
              aria-pressed={selected}
              className={`min-h-11 rounded-full px-5 text-sm font-medium transition-colors duration-200 ${
                selected
                  ? 'bg-white text-dark'
                  : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
              }`}
            >
              <span className={v.code === 'bn' ? bengaliFontClass : undefined}>{v.nativeLabel}</span>
              {v.code !== 'en' && (
                <span className="ml-2 text-xs opacity-60">{v.englishLabel}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-white/12 bg-black shadow-[0_28px_64px_rgba(0,0,0,0.5)]">
        <video
          ref={videoRef}
          key={current.code}
          poster={current.poster}
          controls
          playsInline
          preload="metadata"
          onPlay={() => { hasPlayed.current = true }}
          className="block aspect-video w-full"
        >
          <source src={current.src} type="video/mp4" />
          Your browser can&apos;t play this video. You can{' '}
          <a href={current.src} download>download it instead</a>.
        </video>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-white/55">
        <p>
          <span className={current.code === 'bn' ? bengaliFontClass : undefined}>{current.title}</span>
          {' — '}
          <span className={current.code === 'bn' ? bengaliFontClass : undefined}>{current.subtitle}</span>
          <span className="mx-2 text-white/25">·</span>
          {current.length}
        </p>
        <a
          href={current.src}
          download
          className="underline underline-offset-4 transition-colors hover:text-white"
        >
          Download this video
        </a>
      </div>
    </div>
  )
}
