/**
 * The honesty label: STRATA is a made-up company, so every view of the page says so. Fixed top-left in STRATA's
 * own HUD style, in the strip above the chapter copy (the phone's chapter code sits top-right), small enough to stay
 * clear of the film's text. A plain <a> (not next/link), so leaving reloads the studio's page fresh, without
 * STRATA's stylesheet still loaded.
 */
export function ConceptLabel() {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load on purpose (see above).
    <a
      href="/"
      className="glass-lite hud-label fixed left-3 top-[max(0.5rem,env(safe-area-inset-top))] z-overlay max-w-[calc(100vw-8.5rem)] rounded-xs px-2 py-1 text-[0.625rem] leading-[1.35] tracking-[0.08em] text-text-2 transition-colors duration-[var(--duration-fast)] hover:text-text-1 md:left-4 md:top-4 md:max-w-none md:text-micro"
    >
      <span className="block md:inline">A concept site by Kingdom Sites.</span>{' '}
      <span className="block md:inline">STRATA is not a real company.</span>
    </a>
  );
}
