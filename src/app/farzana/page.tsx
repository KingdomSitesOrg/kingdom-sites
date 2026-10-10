/* The start of the Farzana marketing page: the film. */

import Wordmark from './Wordmark'

export default function FarzanaPage() {
  return (
    <>
      <header className="farzana-top">
        <Wordmark className="farzana-logo" />
      </header>

      <section className="farzana-hero" aria-labelledby="farzana-title">
        <h1 id="farzana-title" className="farzana-title">
          All of your tools in one place.
        </h1>
        <div className="farzana-film">
          <video
            src="/farzana/farzana-film.mp4"
            poster="/farzana/farzana-film-poster.jpg"
            controls
            playsInline
            preload="metadata"
            width={1920}
            height={1080}
            aria-label="Farzana, a 76-second film"
          />
        </div>
      </section>
    </>
  )
}
