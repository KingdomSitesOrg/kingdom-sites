/**
 * The Latin learning game is made in partnership with JAM with Latin, and its
 * graphics come from JAM with Latin's own designers. Only the Latin game
 * carries this line: no JAM with Latin crest or credit goes anywhere else.
 */
export default function LatinPartner({ className = 'cn-partner' }: { className?: string }) {
  return (
    <p className={className}>
      Made in partnership with{' '}
      <a href="https://jamwithlatin.com" target="_blank" rel="noopener noreferrer">
        JAM with Latin
      </a>
      , with graphics by JAM with Latin’s own designers.
    </p>
  )
}
