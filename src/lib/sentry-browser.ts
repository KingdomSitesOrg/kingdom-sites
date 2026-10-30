/* The parts of Sentry the browser uses, and nothing else. Loading the whole
   package by `import('@sentry/nextjs')` brings in every feature it has,
   Session Replay's recorder included (about 590 KB), even though Replay is off;
   naming the four pieces here lets the build leave the rest out (T-382). */
export { captureException, captureRouterTransitionStart, getClient, init } from '@sentry/nextjs'
