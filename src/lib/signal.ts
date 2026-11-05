/**
 * Our own bug and crash reports, sent to kingdom-signal (Thomas reads them in
 * his console) beside Sentry while the two run side by side. The shape of a
 * report is CONTRACT.md in the crash-reports repo; this file only gathers and
 * sends.
 *
 * In the browser, `startSignal()` (from `instrumentation-client.ts`) reports
 * uncaught errors and rejected promises, and keeps the last 30 steps before
 * one: pages visited, buttons and links pressed, calls made, console errors.
 * The error screen reports what it caught with `reportError`. On the server,
 * `reportRequestError` (from `instrumentation.ts`) reports what a page, route
 * or server action threw.
 *
 * What never leaves: an email, a name typed into a field, a query string, a
 * token or a cookie. Addresses lose everything after `?`; messages lose
 * anything that looks like an email or a token; a link pressed is recorded by
 * where it goes, not by its words, so a roster of names stays out.
 *
 * Nothing is sent from a development server unless SIGNAL_SEND_LOCAL=1 was set
 * when it started. Sending never throws and never holds up a page.
 */
/** Where reports go. The key is public, like Sentry's DSN: it only lets a report in. */
const SIGNAL = {
  app: 'kingdom-sites',
  key: '37b0a8b6279a7437ef236fa2',
  endpoint: 'https://kingdom-signal.tap-to-tick.workers.dev',
} as const

type Level = 'fatal' | 'error' | 'warning'
type Crumb = { t: number; c: 'nav' | 'click' | 'fetch' | 'console' | 'app'; m: string }
type Tags = Record<string, string>

// Written in at build time by next.config.ts (`signalBuildEnv`).
const RELEASE = process.env.SIGNAL_RELEASE || undefined
const ENVIRONMENT = (process.env.SIGNAL_ENVIRONMENT || 'development') as
  | 'production'
  | 'preview'
  | 'development'
const SENDING = ENVIRONMENT !== 'development' || process.env.SIGNAL_SEND_LOCAL === '1'

const ADDRESS = `${SIGNAL.endpoint}/v1/e?k=${SIGNAL.key}`
const REPEAT_MS = 10_000
const MAX_PER_PAGE = 30
const BACK_OFF_MS = 10 * 60_000
const BACK_OFF_KEY = 'signal-back-off'

let sentThisPage = 0
let blockedUntil = 0
const recent = new Map<string, number>()
const crumbs: Crumb[] = []

/** Takes out what must never leave: emails, tokens and query strings. */
function scrub(text: string, max: number): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]')
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[token]')
    .replace(/\b(?:sk|pk|rk|whsec|sb)_[\w-]{8,}/g, '[token]')
    .replace(/((?:https?:\/\/|\/)[^\s?#"'()]*)\?[^\s#"'()]*/g, '$1')
    .slice(0, max)
}

/** An address as a report may carry it: no query, no fragment. */
function bare(href: string): string {
  try {
    const url = new URL(href, typeof location === 'undefined' ? 'http://localhost' : location.href)
    const here = typeof location !== 'undefined' && url.origin === location.origin
    return here ? url.pathname : `${url.host}${url.pathname}`
  } catch {
    return scrub(href, 200)
  }
}

function addCrumb(c: Crumb['c'], m: string) {
  crumbs.push({ t: Date.now(), c, m: scrub(m, 200) })
  if (crumbs.length > 30) crumbs.shift()
}

function blocked(): boolean {
  if (Date.now() < blockedUntil) return true
  if (typeof window === 'undefined') return false
  try {
    blockedUntil = Number(localStorage.getItem(BACK_OFF_KEY)) || 0
  } catch {
    // Storage refused (a private window): the in-memory back-off still holds.
  }
  return Date.now() < blockedUntil
}

function backOff() {
  blockedUntil = Date.now() + BACK_OFF_MS
  try {
    if (typeof window !== 'undefined') localStorage.setItem(BACK_OFF_KEY, String(blockedUntil))
  } catch {
    // As above.
  }
}

/** The first line of a stack that names a place in the code. */
function topFrame(stack: string | undefined): string {
  return stack?.split('\n').find((line) => /\bat |@|:\d+:\d+/.test(line))?.trim() ?? ''
}

/** True for the noise every site gets that is not ours to fix. */
function isNoise(message: string, stack: string | undefined, file?: string): boolean {
  const where = `${stack ?? ''} ${file ?? ''}`
  if (/(?:chrome|moz|safari(?:-web)?)-extension:\/\//.test(where)) return true
  if (/ResizeObserver loop/.test(message)) return true
  // A script from another site that failed: the browser hides everything.
  return /^Script error\.?$/.test(message.trim()) && !stack
}

function toError(thing: unknown): { type: string; message: string; stack?: string; digest?: string } {
  if (thing instanceof Error) {
    const digest = (thing as Error & { digest?: unknown }).digest
    return {
      type: thing.name || thing.constructor?.name || 'Error',
      message: thing.message,
      stack: thing.stack,
      digest: typeof digest === 'string' ? digest : undefined,
    }
  }
  let message: string
  try {
    message = typeof thing === 'string' ? thing : JSON.stringify(thing) ?? String(thing)
  } catch {
    message = String(thing)
  }
  return { type: 'Error', message }
}

/** Builds one report; null when it is a repeat, noise, or over a limit. */
function build(
  platform: 'browser' | 'node' | 'edge',
  thing: unknown,
  extra: {
    level?: Level
    handled?: boolean
    url?: string
    tags?: Tags
    withCrumbs?: boolean
    readStack?: (stack: string) => string
  },
): string | null {
  if (!SENDING || blocked()) return null
  const error = toError(thing)
  if (isNoise(error.message, error.stack)) return null
  const key = `${error.type}|${error.message}|${topFrame(error.stack)}`
  const now = Date.now()
  if (now - (recent.get(key) ?? 0) < REPEAT_MS) return null
  recent.set(key, now)
  if (recent.size > 100) recent.delete(recent.keys().next().value as string)

  const tags: Tags = { ...extra.tags }
  if (error.digest) tags.digest = error.digest
  const report = {
    v: 1,
    platform,
    release: RELEASE,
    environment: ENVIRONMENT,
    level: extra.level ?? 'error',
    handled: extra.handled ?? false,
    type: scrub(error.type, 120),
    message: scrub(error.message, 1000),
    stack: error.stack ? scrub(extra.readStack?.(error.stack) ?? error.stack, 16_000) : undefined,
    url: extra.url,
    tags,
    crumbs: extra.withCrumbs ? [...crumbs] : undefined,
    t: now,
  }
  let body = JSON.stringify(report)
  if (body.length > 60_000) {
    body = JSON.stringify({ ...report, stack: report.stack?.slice(0, 6000), crumbs: report.crumbs?.slice(-10) })
  }
  return body
}

// ---------------------------------------------------------------- browser

/** Browser and system, by name and major version only. */
function deviceTags(): Tags {
  const ua = navigator.userAgent
  const tags: Tags = {}
  const named =
    ua.match(/(Edg|OPR|Firefox|FxiOS|CriOS|SamsungBrowser)\/(\d+)/) ?? ua.match(/(Chrome)\/(\d+)/)
  const safari = named ? null : ua.match(/Version\/(\d+(?:\.\d+)?).*Safari/)
  const names: Record<string, string> = {
    Edg: 'Edge',
    OPR: 'Opera',
    FxiOS: 'Firefox',
    CriOS: 'Chrome',
    SamsungBrowser: 'Samsung Internet',
  }
  if (named) tags.browser = `${names[named[1]] ?? named[1]} ${named[2]}`
  else if (safari) tags.browser = `Safari ${safari[1]}`
  const ios = ua.match(/(?:iPhone|iPad|iPod).*? OS (\d+)_(\d+)/)
  const android = ua.match(/Android (\d+(?:\.\d+)?)/)
  if (ios) tags.os = `iOS ${ios[1]}.${ios[2]}`
  else if (android) tags.os = `Android ${android[1]}`
  else if (/Windows/.test(ua)) tags.os = 'Windows'
  else if (/Mac OS X/.test(ua)) tags.os = 'macOS'
  else if (/CrOS/.test(ua)) tags.os = 'ChromeOS'
  else if (/Linux/.test(ua)) tags.os = 'Linux'
  return tags
}

function sendFromBrowser(body: string) {
  sentThisPage += 1
  try {
    if (navigator.sendBeacon?.(ADDRESS, body)) return
  } catch {
    // Some browsers refuse a beacon on a page being closed; try a plain call.
  }
  fetch(ADDRESS, { method: 'POST', body, keepalive: true, credentials: 'omit', headers: { 'Content-Type': 'text/plain' } })
    .then((answer) => {
      if (answer.status === 429) backOff()
    })
    .catch(() => {})
}

/**
 * Reports one error from the browser. The error screens call it with what they
 * caught; `startSignal` calls it for everything nothing caught.
 */
export function reportError(thing: unknown, options: { level?: Level; handled?: boolean; tags?: Tags } = {}) {
  try {
    if (typeof window === 'undefined' || sentThisPage >= MAX_PER_PAGE) return
    const body = build('browser', thing, {
      ...options,
      url: `${location.origin}${location.pathname}`,
      tags: { ...deviceTags(), ...options.tags },
      withCrumbs: true,
    })
    if (body) sendFromBrowser(body)
  } catch {
    // Reporting must never become the error.
  }
}

function watchPages() {
  let last = location.pathname
  addCrumb('nav', `open ${last}`)
  const moved = () => {
    if (location.pathname === last) return
    addCrumb('nav', `${last} → ${location.pathname}`)
    last = location.pathname
  }
  for (const name of ['pushState', 'replaceState'] as const) {
    const original = history[name]
    history[name] = function (this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args)
      moved()
      return result
    }
  }
  window.addEventListener('popstate', moved)
}

function watchClicks() {
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target : null
      const control = target?.closest('a[href], button, [role=button], [role=link], [role=tab], [role=menuitem]')
      if (!control) return
      if (control instanceof HTMLAnchorElement) {
        addCrumb('click', `link → ${bare(control.href)}`)
        return
      }
      const label = (control.getAttribute('aria-label') || control.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60)
      addCrumb('click', label ? `button '${label}'` : 'button')
    },
    { capture: true },
  )
}

function watchCalls() {
  const original = window.fetch
  const watched: typeof window.fetch = async (input, init) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (href.startsWith(SIGNAL.endpoint)) return original(input, init)
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
    const where = `${method} ${bare(href)}`
    try {
      const answer = await original(input, init)
      addCrumb('fetch', `${where} ${answer.status}`)
      return answer
    } catch (error) {
      addCrumb('fetch', `${where} failed`)
      throw error
    }
  }
  window.fetch = watched
}

function watchConsole() {
  const original = console.error
  console.error = (...args: unknown[]) => {
    try {
      const first = args[0]
      addCrumb('console', first instanceof Error ? `${first.name}: ${first.message}` : String(first))
    } catch {
      // A value that cannot be written as text; the error itself still logs.
    }
    original.apply(console, args)
  }
}

/** Starts watching the page. Called once, from `instrumentation-client.ts`. */
export function startSignal() {
  if (typeof window === 'undefined' || !SENDING) return
  const flagged = window as Window & { __signal?: boolean }
  if (flagged.__signal) return
  flagged.__signal = true
  try {
    watchPages()
    watchClicks()
    watchCalls()
    watchConsole()
  } catch {
    // A browser without one of these still reports errors.
  }
  window.addEventListener('error', (event) => {
    if (isNoise(event.message ?? '', event.error?.stack, event.filename)) return
    reportError(event.error ?? new Error(event.message || 'Unknown error'))
  })
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    reportError(
      reason instanceof Error
        ? reason
        : Object.assign(new Error(toError(reason).message), { name: 'UnhandledRejection' }),
    )
  })
}

// ----------------------------------------------------------------- server

type SourceMapEntry = { originalSource?: string; originalLine?: number; originalColumn?: number }
type NodeSourceMap = { findEntry(line: number, column: number): SourceMapEntry }
type NodeBuiltins = {
  'node:module': { SourceMap: new (payload: unknown) => NodeSourceMap }
  'node:fs': { readFileSync(path: string, encoding: 'utf8'): string }
  'node:process': { cwd(): string }
}

const serverMaps = new Map<string, NodeSourceMap | null>()

/** A source file as the repository names it: `src/app/page.tsx`. */
function repoPath(source: string, folder: string): string {
  const path = source
    .replace(/^webpack:\/\/[^/]*\//, '')
    .replace(/^turbopack:\/\/\/?(\[project\]\/)?/, '')
    .replace(/^file:\/\//, '')
    .replace(/^(\.\/)+/, '')
  return path.startsWith(`${folder}/`) ? path.slice(folder.length + 1) : path
}

/**
 * Rewrites a Node stack to the files and lines the code was written at, from
 * the server's own source maps (kept by `serverSourceMaps` in next.config.ts),
 * read only when an error is reported. Turning maps on for the whole server
 * (`process.setSourceMapsEnabled`) cost about 190 MB and a second on the first
 * pages, and Next replaces the stack writer it would use, so it is not used.
 * Any frame without a map is left as it was.
 */
function readServerStack(stack: string): string {
  const load = (process as { getBuiltinModule?: <K extends keyof NodeBuiltins>(id: K) => NodeBuiltins[K] })
    .getBuiltinModule
  if (!load) return stack
  const { SourceMap } = load('node:module')
  const { readFileSync } = load('node:fs')
  const folder = load('node:process').cwd()
  const mapFor = (file: string) => {
    if (!serverMaps.has(file)) {
      let map: NodeSourceMap | null = null
      try {
        map = new SourceMap(JSON.parse(readFileSync(`${file}.map`, 'utf8')))
      } catch {
        // No map beside this file: the frame stays as it is.
      }
      if (serverMaps.size > 50) serverMaps.clear()
      serverMaps.set(file, map)
    }
    return serverMaps.get(file)
  }
  return stack
    .split('\n')
    .map((line) => {
      const frame = line.match(/^(\s*at (?:.*? \()?)((?:file:\/\/)?\/[^:()]+\.m?js):(\d+):(\d+)(\)?)$/)
      if (!frame) return line
      const [, head, file, row, column, tail] = frame
      const entry = mapFor(file.replace(/^file:\/\//, ''))?.findEntry(Number(row) - 1, Number(column) - 1)
      if (!entry?.originalSource || entry.originalLine === undefined) return line
      return `${head}${repoPath(entry.originalSource, folder)}:${entry.originalLine + 1}:${(entry.originalColumn ?? 0) + 1}${tail}`
    })
    .join('\n')
}

type RequestInfo = { path: string; method: string }
type RequestContext = { routerKind: string; routePath: string; routeType: string }

/**
 * Reports what a page, route or server action threw. Next calls this through
 * `onRequestError` in `instrumentation.ts`, beside Sentry. It sends in the
 * background: on Vercel the function is kept alive for it, and it gives up
 * after 2 seconds.
 */
export function reportRequestError(error: unknown, request: RequestInfo, context: RequestContext) {
  try {
    const platform = process.env.NEXT_RUNTIME === 'edge' ? 'edge' : 'node'
    const body = build(platform, error, {
      url: request.path.split(/[?#]/)[0],
      tags: {
        route: context.routePath,
        routeType: context.routeType,
        router: context.routerKind,
        method: request.method,
      },
      readStack: platform === 'node' ? readServerStack : undefined,
    })
    if (!body) return
    const sending = fetch(ADDRESS, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'text/plain' },
      signal: AbortSignal.timeout(2000),
    })
      .then((answer) => {
        if (answer.status === 429) backOff()
        if (process.env.SIGNAL_SEND_LOCAL === '1') console.info(`signal: report answered ${answer.status}`)
      })
      .catch(() => {})
    // Vercel's hook for work that finishes after the answer has gone (Sentry
    // uses the same one); elsewhere the server simply keeps running.
    const store = (globalThis as { [key: symbol]: { get?: () => { waitUntil?: (p: Promise<unknown>) => void } } })[
      Symbol.for('@next/request-context')
    ]
    store?.get?.()?.waitUntil?.(sending)
  } catch {
    // Reporting must never become the error.
  }
}
