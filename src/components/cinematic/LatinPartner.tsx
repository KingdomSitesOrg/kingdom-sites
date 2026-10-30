/**
 * JAM Legio, the Latin learning game, is made in partnership with JAM with
 * Latin, and its graphics come from JAM with Latin's own designers. Only JAM
 * Legio carries this line: no JAM with Latin crest or credit goes anywhere
 * else. The site may name the app, JAM Legio (Thomas, 2026-10-30, T-382).
 */
export default function LatinPartner({ className = 'cn-partner' }: { className?: string }) {
  return (
    <p className={className}>
      Made in partnership with{' '}
      <a href="https://jamwithlatin.com" target="_blank" rel="noopener noreferrer">
        JAM with Latin
      </a>
      . Graphics by their own designers.
    </p>
  )
}
