/* Error reporting in the browser (Sentry), loaded once the page has settled
   (T-382). With Session Replay it was about half a megabyte of code that every
   page fetched and ran before anything else. Session Replay (recordings of
   visits) is off, by Thomas's call: errors are still reported. Only the parts
   in src/lib/sentry-browser.ts are loaded.

   An error thrown before Sentry arrives is held here and reported as soon as
   it does, so the first second of a visit is still covered. */

type SentryModule = typeof import('@/lib/sentry-browser')

let sentry: SentryModule | null = null
const early: unknown[] = []
const holdError = (event: ErrorEvent) => early.push(event.error ?? event.message)
const holdRejection = (event: PromiseRejectionEvent) => early.push(event.reason)

function load() {
  import('@/lib/sentry-browser')
    .then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // In-app browsers (Facebook, Instagram, and friends) inject their own tracking
        // scripts into every page they open. Those scripts are served from app:// rather
        // than from our own domain, and they routinely throw as the visitor navigates
        // away — "Java object is gone" is the Android one talking to a native object
        // that has already been torn down. Sentry catches them because it wraps event
        // handlers, but they are the in-app browser's bugs, not ours, and reporting them
        // buries the errors that are actually worth looking at.
        denyUrls: [/^app:\/\//, /^webkit-masked-url:/],
        ignoreErrors: [
          'Java object is gone',
          'Java exception was raised during method invocation',
        ],

        debug: false,
      })
      sentry = Sentry
      removeEventListener('error', holdError)
      removeEventListener('unhandledrejection', holdRejection)
      for (const error of early.splice(0)) Sentry.captureException(error)
    })
    .catch(() => {
      // Sentry itself could not load (offline, blocked): the page carries on without it.
    })
}

if (typeof window !== 'undefined') {
  addEventListener('error', holdError)
  addEventListener('unhandledrejection', holdRejection)
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 4000 })
  else setTimeout(load, 2000)
}

export function onRouterTransitionStart(...args: Parameters<SentryModule['captureRouterTransitionStart']>) {
  sentry?.captureRouterTransitionStart(...args)
}
