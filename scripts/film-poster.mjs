// Makes the poster frame of the Mission page's film light enough to load with
// the page (T-379): a 16:9 crop of one still from the film, as AVIF, WebP and
// baseline JPEG at three widths in public/opt/, plus its average tone and a
// tiny blurred copy for the placeholder, written to src/lib/film-poster.ts.
// The film is letterboxed, so the still is cropped to the picture first.
// Usage, from the repo root:
//   node scripts/film-poster.mjs <still.jpg> [left offset of the 16:9 crop, in px of the 1920-wide still]
import fs from 'node:fs'
import { createRequire } from 'node:module'

const sharp = createRequire(import.meta.url)('sharp')
const [still, left = '0'] = process.argv.slice(2)
if (!still) throw new Error('Pass the still to use as the first argument.')

const NAME = 'mission-film-poster'
const WIDTHS = [480, 800, 1200]
const { width, height } = await sharp(still).metadata()
// The picture inside the letterbox bars: 1920x804 for a 2.39:1 film in a 1920x1080 frame.
const picH = Math.round((width * 804) / 1920)
const top = Math.round((height - picH) / 2)
const cropW = Math.round((picH * 16) / 9)
const region = { left: Math.min(Number(left), width - cropW), top, width: cropW, height: picH }
const base = () => sharp(still).extract(region)

fs.mkdirSync('public/opt', { recursive: true })
for (const w of WIDTHS) {
  const img = () => base().resize({ width: w })
  await img().avif({ quality: 50, effort: 6 }).toFile(`public/opt/${NAME}-${w}.avif`)
  await img().webp({ quality: 72 }).toFile(`public/opt/${NAME}-${w}.webp`)
  await img().jpeg({ quality: 76, progressive: false, mozjpeg: false }).toFile(`public/opt/${NAME}-${w}.jpg`)
}
const { dominant } = await base().stats()
const tiny = await base().resize({ width: 12 }).blur(0.6).jpeg({ quality: 60 }).toBuffer()

fs.writeFileSync(
  'src/lib/film-poster.ts',
  `/* Written by scripts/film-poster.mjs: the sized copies of the Mission page's
   film poster in public/opt/, its average tone and a tiny blurred copy for
   the placeholder. Do not edit by hand. */
export const FILM_POSTER = ${JSON.stringify(
    { name: NAME, widths: WIDTHS, tone: `rgb(${dominant.r},${dominant.g},${dominant.b})`, blur: `data:image/jpeg;base64,${tiny.toString('base64')}` },
    null,
    2,
  )}
`,
)
console.log(NAME, WIDTHS.join(' '))
