/**
 * Article covers (T-388): a simple abstract picture for every article that has
 * no photo, drawn from the article's slug so each one is different and stays
 * the same from build to build. Each article in the list takes the next kind
 * of picture in turn, so neighbours never look alike. Only the site's own colours: the dark room,
 * the warm white, and a few quiet earth tones. 1200x630, the share-card shape,
 * so the same picture is the page's cover and its link preview.
 */

import { ARTICLES } from '@/content/articles'

export const COVER = { width: 1200, height: 630 }

const BG = ['#141416', '#101012', '#18171a']
const FG = '#efebe3'
const DIM = '#8e8a82'
/* Cool tones for the guides. */
const TONES: Record<string, string[]> = {
  guides: ['#8fa39a', '#a9b5c4', '#c9b48a', '#e3a283'],
}

/** A small seeded random number source (mulberry32), seeded from the slug. */
function random(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10

type Draw = (rnd: () => number, a: string, b: string) => string

/* Five kinds of picture: the article's place in the list picks one, its slug the sizes and places. */
const DRAWINGS: Draw[] = [
  // Orbits: a sun, its rings, a few moons.
  (rnd, a, b) => {
    const cx = 380 + rnd() * 440
    const cy = 200 + rnd() * 230
    const r = 110 + rnd() * 70
    let s = `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="${a}"/>`
    for (let i = 1; i <= 4; i++) s += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r + i * 62)}" fill="none" stroke="${FG}" stroke-opacity="${0.22 - i * 0.04}" stroke-width="2"/>`
    for (let i = 0; i < 4; i++) {
      const t = rnd() * Math.PI * 2
      const d = r + (1 + Math.floor(rnd() * 4)) * 62
      s += `<circle cx="${r1(cx + Math.cos(t) * d)}" cy="${r1(cy + Math.sin(t) * d)}" r="${r1(8 + rnd() * 14)}" fill="${i % 2 ? b : FG}"/>`
    }
    return s
  },
  // Bands: wide diagonal stripes and a round shape crossing them.
  (rnd, a, b) => {
    const tilt = -20 + rnd() * 40
    let s = `<g transform="rotate(${r1(tilt)} 600 315)">`
    const colours = [a, FG, b, DIM]
    let x = -300 + rnd() * 100
    for (let i = 0; i < 7; i++) {
      const w = 60 + rnd() * 110
      if (rnd() > 0.3) s += `<rect x="${r1(x)}" y="-400" width="${r1(w)}" height="1500" fill="${colours[i % 4]}" fill-opacity="${i % 4 === 1 ? 0.85 : 0.9}"/>`
      x += w + 40 + rnd() * 90
    }
    s += '</g>'
    s += `<circle cx="${r1(300 + rnd() * 600)}" cy="${r1(160 + rnd() * 310)}" r="${r1(90 + rnd() * 60)}" fill="${BG[0]}" stroke="${FG}" stroke-width="3"/>`
    return s
  },
  // Dots: a field of dots, a few lit, under one large arc.
  (rnd, a, b) => {
    let s = ''
    const gap = 54
    for (let y = 45; y < 630; y += gap) {
      for (let x = 45; x < 1200; x += gap) {
        const lit = rnd()
        const fill = lit > 0.94 ? a : lit > 0.9 ? b : DIM
        s += `<circle cx="${x}" cy="${y}" r="${lit > 0.9 ? 9 : 4}" fill="${fill}" fill-opacity="${lit > 0.9 ? 1 : 0.45}"/>`
      }
    }
    const cx = 200 + rnd() * 800
    const r = 260 + rnd() * 120
    s += `<path d="M ${r1(cx - r)} 630 A ${r1(r)} ${r1(r)} 0 0 1 ${r1(cx + r)} 630" fill="none" stroke="${FG}" stroke-width="22" stroke-linecap="round"/>`
    return s
  },
  // Waves: soft hills stacked one over another.
  (rnd, a, b) => {
    const colours = [DIM, b, a, FG]
    let s = ''
    for (let i = 0; i < 4; i++) {
      const base = 250 + i * 95
      const amp = 40 + rnd() * 50
      const phase = rnd() * 600
      let d = `M 0 ${base}`
      for (let x = 0; x <= 1200; x += 300) {
        const y = base + Math.sin((x + phase) / 190) * amp
        d += ` Q ${x + 150} ${r1(y - amp)} ${x + 300} ${r1(y)}`
      }
      d += ' L 1200 630 L 0 630 Z'
      s += `<path d="${d}" fill="${colours[i]}" fill-opacity="${i === 3 ? 0.9 : 0.85}"/>`
    }
    s += `<circle cx="${r1(150 + rnd() * 900)}" cy="${r1(90 + rnd() * 90)}" r="${r1(36 + rnd() * 30)}" fill="${FG}"/>`
    return s
  },
  // Blocks: half circles and squares on a loose grid, like cut paper.
  (rnd, a, b) => {
    const colours = [a, FG, b, DIM]
    let s = ''
    const size = 170
    for (let y = 40; y + size <= 610; y += size + 20) {
      for (let x = 50; x + size <= 1170; x += size + 20) {
        const pick = rnd()
        if (pick < 0.35) continue
        const fill = colours[Math.floor(rnd() * 4)]
        const turn = Math.floor(rnd() * 4) * 90
        const cx = x + size / 2
        const cy = y + size / 2
        s +=
          pick < 0.7
            ? `<path d="M ${x} ${cy} A ${size / 2} ${size / 2} 0 0 1 ${x + size} ${cy} Z" fill="${fill}" transform="rotate(${turn} ${cx} ${cy})"/>`
            : `<rect x="${x + 20}" y="${y + 20}" width="${size - 40}" height="${size - 40}" rx="14" fill="${fill}" fill-opacity="0.9"/>`
      }
    }
    return s
  },
]

/** The cover as an SVG document. */
export function coverSvg(slug: string, section: string): string {
  const rnd = random(`${section}/${slug}`)
  const tones = TONES[section] ?? TONES.guides
  const a = tones[Math.floor(rnd() * tones.length)]
  const b = tones.filter((t) => t !== a)[Math.floor(rnd() * (tones.length - 1))]
  const place = ARTICLES.findIndex((x) => x.section === section && x.slug === slug)
  const draw = DRAWINGS[(place >= 0 ? place : Math.floor(rnd() * 97)) % DRAWINGS.length]
  const bg = BG[Math.floor(rnd() * BG.length)]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER.width} ${COVER.height}" width="${COVER.width}" height="${COVER.height}" preserveAspectRatio="xMidYMid slice"><rect width="100%" height="100%" fill="${bg}"/>${draw(rnd, a, b)}</svg>`
}

export function coverDataUri(slug: string, section: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(coverSvg(slug, section)).toString('base64')}`
}
