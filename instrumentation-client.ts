import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
