// Makes the phone screenshots light enough to load ahead of time (T-368).
// For each shot: AVIF, WebP and baseline JPEG at a few widths in public/opt/,
// plus its average tone and a tiny blurred copy for the placeholder, written
// to src/lib/phone-shots.ts. Run again after changing a shot:
//   node scripts/phone-shots.mjs
import fs from 'node:fs'
import { createRequire } from 'node:module'

const sharp = createRequire(import.meta.url)('sharp')
const SHOTS = [
  '/jam-legio/home.jpg',
  '/jam-legio/map.jpg',
  '/jam-legio/case-challenge.jpg',
  '/jam-legio/leaderboard.jpg',
  '/work/ruta-crew-queue.jpg',
  '/work/ruta-crew-visit.jpg',
  '/work/ruta-crew-time.jpg',
  '/work/demo-class-phone.jpg',
]
const WIDTHS = [240, 360, 540]

fs.mkdirSync('public/opt', { recursive: true })
const out = {}
for (const src of SHOTS) {
  const file = 'public' + src
  const name = src.slice(1).replace(/\.\w+$/, '').replace(/\//g, '-')
  const { width } = await sharp(file).metadata()
  const widths = [...WIDTHS.filter((w) => w < width - 40), width]
  for (const w of widths) {
    const img = () => sharp(file).resize({ width: w })
    await img().avif({ quality: 52, effort: 6 }).toFile(`public/opt/${name}-${w}.avif`)
    await img().webp({ quality: 74 }).toFile(`public/opt/${name}-${w}.webp`)
    await img().jpeg({ quality: 78, progressive: false, mozjpeg: false }).toFile(`public/opt/${name}-${w}.jpg`)
  }
  const { dominant } = await sharp(file).stats()
  const tiny = await sharp(file).resize({ width: 12 }).blur(0.6).jpeg({ quality: 60 }).toBuffer()
  out[src] = {
    name,
    widths,
    tone: `rgb(${dominant.r},${dominant.g},${dominant.b})`,
    blur: `data:image/jpeg;base64,${tiny.toString('base64')}`,
  }
  console.log(name, widths.join(' '))
}

fs.writeFileSync(
  'src/lib/phone-shots.ts',
  `/* Written by scripts/phone-shots.mjs: the sized copies of each phone
   screenshot in public/opt/, its average tone and a tiny blurred copy for
   the placeholder. Do not edit by hand. */
export const PHONE_SHOTS: Record<string, { name: string; widths: number[]; tone: string; blur: string }> = ${JSON.stringify(out, null, 2)}
`,
)
