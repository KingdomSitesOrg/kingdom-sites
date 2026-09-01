/**
 * The commercial offer, in one place.
 *
 * Mobile apps (systems included) on a monthly retainer, quoted after a
 * conversation. No published app price. Separate AI consultation at $75/hour.
 */

import { INQUIRE_CTA, INQUIRE_PATH } from './contact'

export const HERO = {
  title: 'Mobile application solutions',
  accent: 'to bring your business, idea, or tool needs to life',
  sub:
    'If you have an idea — a tool, a system, or a consumer app — and you want someone who will build it and stay after the first version, I would like to hear it. Other software is welcome too. No pressure. We will talk and decide if it is a fit.',
}

export const APP_OFFER = {
  title: 'Apps I build.',
  sub:
    'Phone and tablet apps people actually use. The work includes whatever the app needs to be real — accounts, a backend, an office screen. I keep shipping features and fixes after launch. Not a handoff.',
}

export const AI_CONSULT = {
  name: 'AI consultation',
  priceHourly: 75,
  minimumHours: 1,
  priceLabel: '$75',
  homeTitle: 'I also do AI consultation.',
  homeSub:
    'How to use AI yourself — for developers, admins, and anyone exploring the real tooling: loops, goals, connectors, skills, and instruction files. Not just chatting.',
  pageTitle: 'Learn to use AI for real work.',
  pageSub:
    'A working hour on how to leverage AI for yourself. Developers, admins, or general — we go past chat into loops, goals, connectors, skills, and .md instruction files.',
  separateNote:
    'This consultation is 100% separate from app retainer billing. It is its own product, invoiced after the hour.',
  invoiceNote: 'You book a one-hour slot. I invoice $75 after we meet.',
  inAppTitle: 'AI in your app',
  inAppBody:
    'If your product needs AI inside it — answers from your data, actions with a person in the loop — that work is part of the app retainer. Not a separate fee.',
}

export const RETAINER = {
  line: 'App work is a monthly retainer. No one-time build fee. I quote after we talk.',
  short: 'Monthly retainer, quoted after a conversation.',
  calendarTitle: 'Schedule a conversation',
  calendarHint: 'Pick a time that works for you — no pressure, just a chat.',
}

export const INQUIRY = {
  heading: 'Tell me what you have in mind.',
  sub:
    'Name and email are enough. Add a message if you want. No pressure — we will decide together if it is a fit.',
  formTitle: 'Send a note',
  calendarTitle: 'Schedule a conversation',
  calendarHint: 'Pick a time that works for you — no pressure, just a chat.',
}

/* Three apps on the home cluster. Those are CSS phone drawings, not photos.
   My Work uses `phones` (CSS) or `shots` (photos of Thomas's own apps). */
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
    line: 'A Latin learning app — curriculum, game, and a reason to come back.',
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
] as const

export const HOME_APP_PHONES = [
  { href: '/tap-to-tick', name: 'Tap to Tick', variant: 'spend' as const },
  { href: '/ruta', name: 'Ruta', variant: 'queue' as const },
  { href: '/latin-game', name: 'Jam with Latin', variant: 'cards' as const },
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
