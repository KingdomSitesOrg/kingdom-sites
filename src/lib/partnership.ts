/**
 * The commercial offer, in one place.
 *
 * Mobile apps and the systems behind them. No published prices anywhere on the
 * site — every project is quoted once the work is understood. The goal of every
 * page is one thing: start a conversation.
 */

import { INQUIRE_CTA, INQUIRE_PATH } from './contact'

/* The hero leads with the newest launch. Swap these back to the general app
   offer once the announcement has run its course. */
export const HERO = {
  eyebrow: 'Out now on the App Store',
  title: 'Jam with Latin is out now.',
  accent: 'Want an app like this? I can build yours.',
  sub:
    'A Latin learning game I designed, built, and shipped — live on the App Store and already in students’ hands. Have an idea for an app, a tool, or a system for your business? Tell me about it.',
  appHref: '/latin-game',
  appCta: 'See Jam with Latin',
  shots: [
    { src: '/latin-game/map.jpg', alt: 'Jam with Latin campaign map' },
    { src: '/latin-game/home.jpg', alt: 'Jam with Latin home screen' },
    { src: '/latin-game/case-challenge.jpg', alt: 'Jam with Latin case challenge' },
  ],
}

export const APP_OFFER = {
  title: 'Apps I have built.',
  sub: 'Real products, live today — designed, built, shipped, and still looked after.',
}

/* How working together starts. No prices — a quote comes once the project is understood. */
export const PROCESS = {
  title: 'How it starts.',
  sub: 'Simple, personal, and no pressure. You talk to the person who builds it.',
  steps: [
    {
      title: 'Tell me the idea',
      body: 'A few lines is plenty — an app, a tool, a problem you keep working around.',
    },
    {
      title: 'We talk it through',
      body: 'I ask the questions that matter and learn what you need it to do.',
    },
    {
      title: 'You get a clear quote',
      body: 'Once I understand the project, I put together a plan and a quote. No pressure.',
    },
  ],
}

export const QUOTE_LINE = 'We talk first. You get a quote once I understand the project.'

export const AI_CONSULT = {
  name: 'AI consultation',
  homeTitle: 'I also do AI consultation.',
  homeSub:
    'How to use AI yourself — for developers, admins, and anyone exploring the real tooling: loops, goals, connectors, skills, and instruction files. Not just chatting.',
  pageTitle: 'Learn to use AI for real work.',
  pageSub:
    'Hands-on sessions on how to leverage AI for yourself. Developers, admins, or general — we go past chat into loops, goals, connectors, skills, and .md instruction files.',
  bookTitle: 'Book a session',
  bookBody:
    'Tell me who you are and what you want to get out of AI. I will reply to set a time and shape the session around you.',
  inAppTitle: 'AI in your app',
  inAppBody:
    'If your product needs AI inside it — answers from your data, actions with a person in the loop — I build that into the app itself.',
}

export const INQUIRY = {
  heading: 'Tell me what you have in mind.',
  sub:
    'Name and email are enough. Add a few lines about the idea if you like — we will talk and decide together if it is a fit.',
  formTitle: 'Send a note',
  calendarTitle: 'Schedule a conversation',
  calendarHint: 'Pick a time that works for you — no pressure, just a chat.',
}

/* Home cluster: photos of Thomas’s own apps, CSS drawing for Ruta.
   My Work uses `phones` (CSS) or `shots` (photos). */
export const APP_PROOF = [
  {
    name: 'Ruta',
    href: '/ruta',
    line: 'Contract work on a live service-management platform for landscaping businesses.',
    phone: 'queue' as const,
    phones: ['spend', 'queue', 'cards'] as const,
    shots: [] as const,
  },
  {
    name: 'Jam with Latin',
    href: '/latin-game',
    line: 'A Latin learning game, live on the App Store — curriculum, play, and a reason for students to come back every day.',
    phone: 'cards' as const,
    shots: [
      { src: '/latin-game/home.jpg', alt: 'Jam with Latin home screen' },
      { src: '/latin-game/map.jpg', alt: 'Jam with Latin campaign map' },
      { src: '/latin-game/leaderboard.jpg', alt: 'Jam with Latin leaderboard' },
    ],
  },
  {
    name: 'Tap to Tick',
    href: '/tap-to-tick',
    line: 'A focused iPhone expense app — log a purchase in one tap.',
    phone: 'spend' as const,
    shots: [
      { src: '/tap-to-tick/overview.jpg', alt: 'Tap to Tick overview' },
      { src: '/tap-to-tick/log.jpg', alt: 'Tap to Tick log' },
      { src: '/tap-to-tick/accounts.jpg', alt: 'Tap to Tick accounts' },
    ],
  },
  {
    name: 'Delta Development Project',
    href: 'https://deltadevelopmentproject.com',
    line: 'A development project website for communities in northern Bangladesh and Dhaka.',
    shots: [] as const,
  },
  {
    name: 'KCUPG',
    href: 'https://kcupgs.com',
    line: 'Kansas City South Asian community dashboard — people, languages, and faith at a glance.',
    shots: [] as const,
  },
] as const

export const HOME_CLUSTER = [
  {
    href: '/tap-to-tick',
    name: 'Tap to Tick',
    shot: { src: '/tap-to-tick/overview.jpg', alt: 'Tap to Tick overview' },
  },
  {
    href: '/ruta',
    name: 'Ruta',
    mock: 'portal' as const,
  },
  {
    href: '/latin-game',
    name: 'Jam with Latin',
    shot: { src: '/latin-game/home.jpg', alt: 'Jam with Latin home screen' },
  },
] as const

export const AI_CONSULT_TOPICS = [
  {
    title: 'For developers',
    desc: 'Instruction files in the repo, skills, custom tools, and agent loops that run real jobs in your codebase.',
  },
  {
    title: 'For admins',
    desc: 'Inbox, reports, and the weekly work that should run the same way every time — without you rebuilding it.',
  },
  {
    title: 'For everyone else',
    desc: 'How to explore AI beyond a chat box: goals, connectors, and a setup you can actually keep using.',
  },
  {
    title: 'Loops and goals',
    desc: 'An agent on a schedule or a trigger. Describe the job once; it keeps moving without being asked.',
  },
  {
    title: 'Connectors and skills',
    desc: 'Wire the model to the systems you already use, and package the procedures you repeat so they run properly.',
  },
  {
    title: '.md files that teach the tool',
    desc: 'Plain markdown that tells an assistant how you work, what never to touch, and how to do the next task.',
  },
]

export { INQUIRE_CTA, INQUIRE_PATH }
