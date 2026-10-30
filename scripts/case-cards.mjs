// Draws each case study's share card (T-389): 1200 by 630, in the same design
// as the site's own card (src/app/opengraph-image.jpg): the dark room, a small
// kicker, the project's name in big narrow letters, a line under it, and one of
// the project's real screens in a browser window leaning in from the right.
// Written to public/share/<slug>.jpg. Needs Playwright's headless Chromium
// (~/.cache/ms-playwright) and a network connection for the Archivo font.
// Usage, from the repo root:
//   node scripts/case-cards.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const sharp = createRequire(import.meta.url)('sharp')

const CARDS = [
  { slug: 'farzana-classroom', name: 'Farzana Classroom', line: 'Software for schools · Web, phone and desktop', shot: 'public/work/farzana-home.jpg', product: 'Farzana Classroom' },
  { slug: 'kcupg', name: 'KCUPG', line: 'Kansas City’s communities on one map', shot: 'public/work/kcupg-map.jpg', product: 'KCUPG' },
  { slug: 'delta', name: 'Delta Development Project', line: 'A website for a project of SIM Bangladesh', shot: 'public/work/cards/delta.jpg', product: 'Delta Development Project' },
]

const shell = () => {
  const root = path.join(os.homedir(), '.cache/ms-playwright')
  const dir = fs.readdirSync(root).filter((d) => d.startsWith('chromium_headless_shell-')).sort().pop()
  if (!dir) throw new Error('No Playwright headless Chromium in ~/.cache/ms-playwright.')
  const sub = fs.readdirSync(path.join(root, dir)).find((d) => fs.existsSync(path.join(root, dir, d, 'chrome-headless-shell')))
  return path.join(root, dir, sub ?? '', 'chrome-headless-shell')
}

const page = (c, shot) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..700&display=block">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #0b0b0c; }
  body { font-family: 'Archivo', system-ui, sans-serif; color: #efebe3; position: relative; -webkit-font-smoothing: antialiased; }
  .kick { position: absolute; left: 64px; top: 66px; font-size: 18px; letter-spacing: 0.1em; text-transform: uppercase; color: #b8b2a8; font-weight: 500; }
  h1 { position: absolute; left: 64px; top: 112px; width: 600px; margin: 0; font-size: ${c.name.length > 20 ? 84 : 104}px; line-height: 0.92; font-weight: 600; letter-spacing: -0.02em; font-variation-settings: 'wdth' 72; }
  .line { position: absolute; left: 64px; bottom: 102px; font-size: 24px; color: #e0dcd4; }
  .site { position: absolute; left: 64px; bottom: 60px; font-size: 22px; color: #8e8a82; }
  .stage { position: absolute; left: 700px; top: 96px; width: 720px; perspective: 1400px; }
  .win { transform: rotateY(-14deg) rotateZ(-1.5deg); transform-origin: 0 50%; border-radius: 14px; overflow: hidden; background: #1b1b1e; box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 40px 120px rgba(0,0,0,0.6); }
  .bar { display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 14px; }
  .bar i { width: 10px; height: 10px; border-radius: 50%; background: #3a3a3e; }
  .url { margin-left: 14px; width: 300px; height: 22px; border-radius: 6px; background: #26262a; font-size: 13px; color: #8e8a82; display: flex; align-items: center; padding: 0 10px; white-space: nowrap; }
  .win img { display: block; width: 100%; }
</style></head><body>
  <div class="kick">Kingdom Sites · Portfolio</div>
  <h1>${c.name}</h1>
  <div class="line">${c.line}</div>
  <div class="site">kingdom-sites.com</div>
  <div class="stage"><div class="win"><div class="bar"><i></i><i></i><i></i><span class="url">${c.product}</span></div><img src="${shot}"></div></div>
</body></html>`

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'case-cards-'))
fs.mkdirSync('public/share', { recursive: true })
for (const c of CARDS) {
  const html = path.join(tmp, `${c.slug}.html`)
  const png = path.join(tmp, `${c.slug}.png`)
  fs.writeFileSync(html, page(c, `file://${path.resolve(c.shot)}`))
  execFileSync(shell(), [
    '--headless', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files',
    '--window-size=1200,630', '--virtual-time-budget=8000', `--screenshot=${png}`, `file://${html}`,
  ], { stdio: 'ignore' })
  await sharp(png).resize(1200, 630).jpeg({ quality: 82, mozjpeg: true }).toFile(`public/share/${c.slug}.jpg`)
  console.log(`public/share/${c.slug}.jpg`)
}
fs.rmSync(tmp, { recursive: true, force: true })
