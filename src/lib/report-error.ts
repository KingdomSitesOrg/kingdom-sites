/* Reports an error from the browser to Sentry. Sentry loads once the page has
   settled (instrumentation-client.ts), so an error that comes first waits for
   it, up to ten seconds, instead of being lost. */
export function reportError(error: unknown) {
  import('@/lib/sentry-browser')
    .then((Sentry) => {
      const send = (tries: number) => {
        if (Sentry.getClient()) Sentry.captureException(error)
        else if (tries > 0) setTimeout(() => send(tries - 1), 1000)
      }
      send(10)
    })
    .catch(() => {})
}
