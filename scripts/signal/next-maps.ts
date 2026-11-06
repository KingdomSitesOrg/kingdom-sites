/**
 * The build's half of our crash reports (`src/lib/signal.ts`): which release
 * and environment a report says it came from, and readable browser stacks.
 *
 * Browser source maps turn a minified stack back into our own files and lines.
 * They must never be served: anyone could read the whole app's source from
 * them. So the build makes them, `map-index.mjs` cuts them into the small
 * lookup rows the collector keeps and uploads those, and every `.map` under
 * `static/` is then deleted, whether the upload worked or not. Sentry reads the
 * same maps first (its own step runs just before ours, and no longer deletes).
 *
 * Upload needs SIGNAL_UPLOAD_TOKEN and SIGNAL_ENDPOINT in the build's settings.
 * Without them the build says so and carries on; the maps are still deleted.
 * SIGNAL_MAPS_DRY_RUN=1 counts the rows instead of sending them.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import type { NextConfig } from 'next'

/** The commit this build is of: what every report names as its release. */
export function signalRelease(): string {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA?.trim()
  if (fromVercel) return fromVercel
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return 'unknown'
  }
}

/** Vercel's three environments; anything off Vercel is development. */
export function signalEnvironment(): 'production' | 'preview' | 'development' {
  const vercel = process.env.VERCEL_ENV
  return vercel === 'production' || vercel === 'preview' ? vercel : 'development'
}

/** The values `src/lib/signal.ts` reads, written into the app at build time. */
export function signalBuildEnv(): Record<string, string> {
  return {
    SIGNAL_RELEASE: signalRelease(),
    SIGNAL_ENVIRONMENT: signalEnvironment(),
    SIGNAL_SEND_LOCAL: process.env.SIGNAL_SEND_LOCAL === '1' ? '1' : '',
  }
}

function* filesUnder(dir: string): Generator<string> {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* filesUnder(path)
    else yield path
  }
}

/**
 * Each script under static/ paired with its map, as `--map <map>=<address>`.
 * A script names its map in its last line; Turbopack names the two
 * differently, so `<script>.map` is only the fallback (webpack's hidden maps
 * carry no name).
 */
function mapPairs(staticDir: string): string[] {
  const pairs: string[] = []
  for (const path of filesUnder(staticDir)) {
    if (!/\.m?js$/.test(path)) continue
    const named = readFileSync(path, 'utf8').match(/\/\/[#@] sourceMappingURL=([^\s'"]+\.map)\s*$/)?.[1]
    const map = named && !named.includes(':') ? join(dirname(path), named) : `${path}.map`
    if (!existsSync(map)) continue
    pairs.push('--map', `${map}=/_next/static/${relative(staticDir, path).split(sep).join('/')}`)
  }
  return pairs
}

/** Uploads the browser maps' lookup rows, then deletes every map under static/. */
function indexThenDelete(projectDir: string, distDir: string, app: string) {
  const staticDir = join(distDir, 'static')
  const args = [
    join(projectDir, 'scripts', 'signal', 'map-index.mjs'),
    '--app', app,
    '--release', signalRelease(),
    ...mapPairs(staticDir),
  ]
  if (process.env.SIGNAL_MAPS_DRY_RUN === '1') args.push('--dry-run')
  const run = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env })
  if (run.status !== 0) console.warn('signal: source maps were not uploaded; deleting them anyway.')

  let deleted = 0
  for (const path of filesUnder(staticDir)) {
    if (path.endsWith('.map')) {
      rmSync(path, { force: true })
      deleted += 1
    } else if (/\.(m?js|css)$/.test(path)) {
      // A pointer to a map that is gone would only make browsers ask for it.
      const text = readFileSync(path, 'utf8')
      const stripped = text
        .replace(/\n?\/\/[#@] sourceMappingURL=[^\n]+\.map\s*$/, '')
        .replace(/\n?\/\*[#@] sourceMappingURL=[^\n]+\.map\s*\*\/\s*$/, '')
      if (stripped !== text) writeFileSync(path, stripped)
    }
  }
  console.log(`signal: deleted ${deleted} source maps from ${staticDir}`)
}

/**
 * Wraps the finished config (after `withSentryConfig`) so the maps are indexed
 * and deleted once the build has compiled, after anything already hooked there.
 */
export function withSignalMaps(config: NextConfig, app: string): NextConfig {
  const before = config.compiler?.runAfterProductionCompile
  return {
    ...config,
    compiler: {
      ...config.compiler,
      async runAfterProductionCompile(metadata) {
        if (before) await before(metadata)
        indexThenDelete(metadata.projectDir, metadata.distDir, app)
      },
    },
  }
}
