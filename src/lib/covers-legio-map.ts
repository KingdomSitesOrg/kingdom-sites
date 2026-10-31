/**
 * The cover for "Building JAM Legio" (T-403, Thomas: "this should be like a map
 * look"): northern Italy and the edge of Gaul, with the legion's march drawn
 * stop by stop. The thirteen stops and their order are the app's, exactly as
 * the JAM Legio page lists them (src/app/latin-game/page.tsx). Places are real
 * longitudes and latitudes; the coast is simplified by hand. Rhodanus is the
 * Rhône, marked where the road from Augusta Taurīnōrum over the Alps reaches it;
 * Gallia, a whole province, is marked just beyond it.
 */

const W = 1200
const H = 630
/* Longitude 1°E to 17°E across, latitude 47°N down to 41°N: about the right
   shape for 44°N, so Italy is not stretched. */
const x = (lon: number) => Math.round(((lon - 1) / 16) * W * 10) / 10
const y = (lat: number) => Math.round(((47 - lat) / 6) * H * 10) / 10
const pts = (list: [number, number][]) => list.map(([lon, lat]) => `${x(lon)},${y(lat)}`).join(' ')

const SEA = '#0d0d10'
const LAND = '#1b1a1e'
const COAST = '#3a3833'
const GOLD = '#c9a85c'
const FG = '#efebe3'
const DIM = '#8e8a82'

/* The western Mediterranean and the Tyrrhenian Sea, from Catalonia round to below Rome. */
const WEST_SEA: [number, number][] = [
  [0, 41.1], [1.0, 41.1], [2.17, 41.38], [3.2, 41.9], [3.3, 42.3], [3.05, 42.9], [3.5, 43.3], [4.1, 43.55],
  [4.85, 43.35], [5.4, 43.3], [6.0, 43.1], [6.7, 43.4], [7.3, 43.7], [7.7, 43.8], [8.2, 43.9], [8.9, 44.4],
  [9.5, 44.1], [10.2, 43.9], [10.3, 43.5], [10.5, 43.0], [11.1, 42.5], [11.8, 42.1], [12.25, 41.75], [12.6, 41.45],
  [13.0, 41.25], [13.6, 41.2], [14.0, 40.9], [14.3, 40.6], [14.3, 40.0], [0, 40.0],
]
/* The Adriatic, from below Gargano up to Venice and down the Dalmatian coast. */
const ADRIATIC: [number, number][] = [
  [16.9, 40.0], [16.9, 41.1], [16.0, 41.45], [15.9, 41.6], [16.15, 41.9], [15.6, 41.95], [14.75, 42.1],
  [14.2, 42.45], [13.9, 42.9], [13.6, 43.6], [12.6, 44.05], [12.3, 44.5], [12.55, 44.95], [12.3, 45.25],
  [12.35, 45.45], [12.8, 45.6], [13.2, 45.7], [13.75, 45.65], [13.6, 45.5], [13.6, 45.1], [13.9, 44.8],
  [14.3, 45.2], [14.6, 45.25], [15.0, 44.7], [15.6, 44.2], [15.9, 43.7], [16.4, 43.5], [17.0, 43.3],
  [18.0, 42.8], [18.0, 40.0],
]
const CORSICA: [number, number][] = [
  [9.4, 43.0], [9.55, 42.6], [9.5, 42.1], [9.4, 41.6], [9.2, 41.37], [8.8, 41.6], [8.6, 41.9], [8.6, 42.3], [8.7, 42.6], [9.3, 42.7],
]
const SARDINIA: [number, number][] = [[9.15, 41.25], [9.6, 41.0], [9.6, 40.8], [8.2, 40.8], [8.2, 41.0], [8.7, 41.1]]
const ELBA: [number, number][] = [[10.1, 42.8], [10.45, 42.85], [10.4, 42.72], [10.1, 42.74]]

const PO: [number, number][] = [[7.0, 44.7], [7.7, 45.07], [8.4, 45.15], [9.0, 45.12], [10.0, 45.05], [11.0, 44.98], [12.0, 44.95], [12.5, 44.95]]
const RHONE: [number, number][] = [[6.15, 46.2], [5.6, 45.95], [4.83, 45.75], [4.85, 45.3], [4.89, 44.93], [4.8, 43.95], [4.6, 43.45]]
const TIBER: [number, number][] = [[12.25, 41.75], [12.45, 41.9], [12.5, 42.3], [12.35, 42.7], [12.2, 43.2]]
/* The Alps, as a row of small peaks along the arc. */
const ALPS: [number, number][] = [
  [7.1, 44.25], [6.9, 44.6], [6.8, 45.0], [7.0, 45.4], [6.9, 45.8], [7.5, 45.95], [8.1, 46.15], [8.8, 46.35],
  [9.5, 46.4], [10.3, 46.45], [11.0, 46.6], [11.8, 46.55], [12.5, 46.5], [13.2, 46.4],
]

/* The march, in the app's order: name, longitude, latitude, where the label sits. */
type Stop = { name: string; lon: number; lat: number; dx: number; dy: number; anchor?: 'start' | 'end' | 'middle'; kind?: 'camp' | 'goal' }
const STOPS: Stop[] = [
  { name: 'Rōma', lon: 12.5, lat: 41.9, dx: 16, dy: 10 },
  { name: 'Vēiī', lon: 12.4, lat: 42.02, dx: -14, dy: -8, anchor: 'end' },
  { name: 'Clūsium', lon: 11.95, lat: 43.02, dx: 16, dy: 6 },
  { name: 'Pīsae', lon: 10.4, lat: 43.72, dx: -14, dy: 6, anchor: 'end', kind: 'camp' },
  { name: 'Florentia', lon: 11.25, lat: 43.77, dx: 16, dy: 10 },
  { name: 'Bonōnia', lon: 11.34, lat: 44.49, dx: 16, dy: 8 },
  { name: 'Venetiae', lon: 12.33, lat: 45.44, dx: 0, dy: -18, anchor: 'middle', kind: 'camp' },
  { name: 'Vērōna', lon: 10.99, lat: 45.44, dx: 0, dy: -18, anchor: 'middle' },
  { name: 'Mediōlānum', lon: 9.19, lat: 45.46, dx: 0, dy: -18, anchor: 'middle' },
  { name: 'Genua', lon: 8.93, lat: 44.41, dx: 4, dy: 30, anchor: 'middle' },
  { name: 'Augusta Taurīnōrum', lon: 7.69, lat: 45.07, dx: 2, dy: 30, anchor: 'middle' },
  { name: 'Rhodanus', lon: 4.89, lat: 44.93, dx: 16, dy: 8 },
  { name: 'Gallia', lon: 3.3, lat: 45.3, dx: 0, dy: -24, anchor: 'middle', kind: 'goal' },
]

const FONT = `font-family="Georgia, 'Times New Roman', serif"`

export function legioMapSvg(): string {
  let s = `<rect width="${W}" height="${H}" fill="${LAND}"/>`
  s += `<polygon points="${pts(WEST_SEA)}" fill="${SEA}" stroke="${COAST}" stroke-width="2" stroke-linejoin="round"/>`
  s += `<polygon points="${pts(ADRIATIC)}" fill="${SEA}" stroke="${COAST}" stroke-width="2" stroke-linejoin="round"/>`
  for (const island of [CORSICA, SARDINIA, ELBA]) s += `<polygon points="${pts(island)}" fill="${LAND}" stroke="${COAST}" stroke-width="2" stroke-linejoin="round"/>`
  /* Faint lines of longitude and latitude, like an old chart. */
  for (let lon = 2; lon <= 16; lon += 2) s += `<line x1="${x(lon)}" y1="0" x2="${x(lon)}" y2="${H}" stroke="${FG}" stroke-opacity="0.05"/>`
  for (let lat = 42; lat <= 46; lat += 1) s += `<line x1="0" y1="${y(lat)}" x2="${W}" y2="${y(lat)}" stroke="${FG}" stroke-opacity="0.05"/>`
  for (const river of [PO, RHONE, TIBER]) s += `<polyline points="${pts(river)}" fill="none" stroke="#4d5a63" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
  for (const [lon, lat] of ALPS) {
    const px = x(lon)
    const py = y(lat)
    s += `<path d="M ${px - 11} ${py + 7} L ${px} ${py - 8} L ${px + 11} ${py + 7}" fill="none" stroke="${DIM}" stroke-opacity="0.55" stroke-width="2" stroke-linejoin="round"/>`
  }
  /* Sea and land names, quiet. */
  s += `<text x="${x(6.2)}" y="${y(41.9)}" ${FONT} font-size="20" font-style="italic" letter-spacing="3" fill="${DIM}" fill-opacity="0.7">Mare Internum</text>`
  s += `<text x="${x(14.6)}" y="${y(43.4)}" ${FONT} font-size="18" font-style="italic" letter-spacing="3" fill="${DIM}" fill-opacity="0.7" transform="rotate(-38 ${x(14.6)} ${y(43.4)})">Mare Hadriaticum</text>`
  s += `<text x="${x(3.1)}" y="${y(46.3)}" ${FONT} font-size="30" letter-spacing="10" fill="${FG}" fill-opacity="0.16" text-anchor="middle">GALLIA</text>`
  s += `<text x="${x(14.3)}" y="${y(41.62)}" ${FONT} font-size="24" letter-spacing="10" fill="${FG}" fill-opacity="0.14" text-anchor="middle">ITALIA</text>`

  /* The march: a gold dashed road through every stop, in order. */
  const road = STOPS.map((p) => `${x(p.lon)},${y(p.lat)}`).join(' ')
  s += `<polyline points="${road}" fill="none" stroke="${GOLD}" stroke-opacity="0.25" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`
  s += `<polyline points="${road}" fill="none" stroke="${GOLD}" stroke-width="3.5" stroke-dasharray="12 9" stroke-linecap="round" stroke-linejoin="round"/>`
  for (const p of STOPS) {
    const px = x(p.lon)
    const py = y(p.lat)
    if (p.kind === 'goal') {
      s += `<circle cx="${px}" cy="${py}" r="15" fill="none" stroke="${GOLD}" stroke-width="3"/><circle cx="${px}" cy="${py}" r="7" fill="${GOLD}"/>`
    } else if (p.name === 'Rōma') {
      s += `<circle cx="${px}" cy="${py}" r="11" fill="${GOLD}" stroke="${SEA}" stroke-width="3"/>`
    } else if (p.kind === 'camp') {
      s += `<path d="M ${px - 10} ${py + 8} L ${px} ${py - 10} L ${px + 10} ${py + 8} Z" fill="${GOLD}" stroke="${SEA}" stroke-width="2.5" stroke-linejoin="round"/>`
    } else {
      s += `<circle cx="${px}" cy="${py}" r="7.5" fill="${FG}" stroke="${SEA}" stroke-width="3"/>`
    }
    const big = p.name === 'Rōma' || p.kind === 'goal'
    s += `<text x="${px + p.dx}" y="${py + p.dy}" ${FONT} font-size="${big ? 26 : 20}" ${big ? 'font-weight="bold"' : ''} fill="${big ? GOLD : FG}" text-anchor="${p.anchor ?? 'start'}" paint-order="stroke" stroke="${LAND}" stroke-width="5" stroke-linejoin="round">${p.name}</text>`
  }
  return s
}
