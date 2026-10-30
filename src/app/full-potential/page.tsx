import type { Metadata } from 'next'
import './full-potential.css'

/* A personal page, not a Kingdom Sites page: a stop-motion paper film Thomas made over a
   speech on discipline, with the lines that go against scripture cut out. It is kept out
   of search, out of the sitemap and out of the site's navigation; people reach it by link. */
export const metadata: Metadata = {
  title: 'Unlock Your Full Potential — a stop-motion film',
  description: 'A stop-motion paper film over a speech on discipline, pain and hard work.',
  robots: { index: false, follow: false },
}

export default function FullPotentialPage() {
  return (
    <div className="fp">
      <div className="fp-wrap">
        <h1>Unlock Your Full Potential</h1>
        <p className="fp-lede">A stop-motion paper film about discipline, pain and hard work. 14 minutes.</p>
        <video
          className="fp-video"
          src="/full-potential/unlock-full-potential.mp4"
          poster="/full-potential/poster.jpg"
          controls
          playsInline
          preload="metadata"
          width={1920}
          height={1080}
        />
        <p className="fp-credits">
          Speech: Andrew Tate, trimmed. Music: “Scheming (Instrumental)” by You Lose.
        </p>
      </div>
    </div>
  )
}
