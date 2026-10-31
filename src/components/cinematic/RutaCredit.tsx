/**
 * Ruta is a team's product: I work on it as a contractor on Ruta's team. Its
 * home page chapter says so under the crew app's phones, in the same small line
 * JAM Legio's partner credit uses (LatinPartner.tsx). Never "my app" (T-400).
 */
export default function RutaCredit({ className = 'cn-partner' }: { className?: string }) {
  return (
    <p className={className}>
      Contract work, on the team: the product is Ruta’s. Their own site is{' '}
      <a href="https://getruta.com" target="_blank" rel="noopener noreferrer">
        getruta.com
      </a>
      .
    </p>
  )
}
