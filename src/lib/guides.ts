/**
 * Guides: one question each, answered in plain words by Thomas (T-388).
 *
 * Each guide states its answer in the first two sentences, because that is the
 * part search results and AI answers quote. Prices appear only as the site
 * already states them (the rough ranges on /get-started's chat) and public
 * figures appear only with their source. Text may carry links written as
 * [words](/path); the guide page turns them into links.
 */
import { PROJECTS } from '@/lib/work'

export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }

export type Guide = {
  slug: string
  /** The question, as the page's one h1. */
  question: string
  /** The search title (the template adds " | Kingdom Sites"). */
  title: string
  description: string
  /** The answer, in two sentences: the first thing on the page. */
  answer: string
  /** ISO dates YYYY-MM-DD. */
  published: string
  updated: string
  keywords: string[]
  body: GuideBlock[]
  /** Portfolio projects that show the answer in practice (slugs in src/lib/work.ts). */
  related: string[]
  sources?: { label: string; href: string }[]
}

const SOURCES = {
  appleFee: { label: 'Apple: Enroll in the Apple Developer Program', href: 'https://developer.apple.com/programs/enroll/' },
  appleWaiver: { label: 'Apple: Fee waivers', href: 'https://developer.apple.com/help/account/membership/fee-waivers' },
  appleSmallBusiness: { label: 'Apple: App Store Small Business Program', href: 'https://developer.apple.com/app-store/small-business-program/' },
  appleUpcoming: { label: 'Apple: Upcoming requirements', href: 'https://developer.apple.com/news/upcoming-requirements/' },
  playFee: { label: 'Google Play: Register for a developer account', href: 'https://support.google.com/googleplay/android-developer/answer/6112435?hl=en' },
  playService: { label: 'Google Play: Service fees', href: 'https://support.google.com/googleplay/android-developer/answer/112622?hl=en' },
  playTarget: { label: 'Google Play: Target API level requirements', href: 'https://support.google.com/googleplay/android-developer/answer/11926878?hl=en' },
  stripe: { label: 'Stripe: Pricing', href: 'https://stripe.com/pricing' },
  vercel: { label: 'Vercel: Pricing', href: 'https://vercel.com/pricing' },
  supabase: { label: 'Supabase: Pricing', href: 'https://supabase.com/pricing' },
}

export const GUIDES: Guide[] = [
  {
    slug: 'website-or-app',
    question: 'Website or app: which does my business need?',
    title: 'Website or app: which does my business need?',
    description:
      'Most businesses need a website first; an app is worth it when customers come back often or need what only a phone does well. Real examples, what an app adds to the cost, and three questions to decide.',
    answer:
      'Most businesses need a website first, because a website is what people find on Google and what they check before they call. An app is worth it when customers come back often to do the same thing, such as booking, ordering, tracking or learning, or when it needs something only a phone does well.',
    published: '2026-10-30',
    updated: '2026-10-30',
    keywords: ['website or app for my business', 'do I need an app', 'website vs app', 'mobile app or website', 'app developer'],
    body: [
      { type: 'h2', text: 'What a website does best' },
      {
        type: 'ul',
        items: [
          'Gets found in search and on Google Maps',
          'Works on every phone and computer, with nothing to download',
          'Says who you are, what you do and how to reach you',
          'Takes enquiries, bookings and payments',
          'Is quick and cheap to change',
        ],
      },
      {
        type: 'p',
        text: 'For many businesses, churches and organizations, a good website is all the software they need.',
      },
      { type: 'h2', text: 'What an app does best' },
      {
        type: 'ul',
        items: [
          'Sits on the home screen, one tap away',
          'Sends notifications',
          'Works without a signal',
          'Uses the camera, location and other phone features smoothly',
          'Makes a daily habit easy',
        ],
      },
      { type: 'h2', text: 'Examples from my own work' },
      {
        type: 'p',
        text: '[Tap to Tick](/tap-to-tick), my iPhone expense app, is an app because you log a purchase in a tap or two, right when you make it, several times a day. [JAM Legio](/latin-game), a Latin learning game, is an app because daily practice should feel like a game, and new families find it on the App Store and Google Play. On [Ruta](/ruta), the crews use a phone app because they work out in the field, sometimes without a signal, while the office works on the web.',
      },
      {
        type: 'p',
        text: 'The [Delta Development Project](/portfolio#more) is a website: people come to read about its work and support it, not to open it every day. [Farzana Classroom](/portfolio#farzana) is both: families find a class and sign up on the web, and the same school runs on phones and desktop.',
      },
      { type: 'h2', text: 'What an app adds to the cost' },
      {
        type: 'p',
        text: 'An app costs more to build and more to keep. Publishing it needs an Apple Developer Program membership, 99 USD a year ([Apple](https://developer.apple.com/programs/enroll/)), and a Google Play developer account, a one-time 25 USD fee ([Google](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)). Both stores review every release, and both require apps to keep up with new phone systems. [What does it cost to keep an app running after launch?](/guides/cost-to-keep-an-app-running) has the details.',
      },
      {
        type: 'p',
        text: 'As rough ranges, never a quote: a basic website is around $1,000 to $2,000, a basic app around $3,000 to $5,000, and more complex projects around $6,000 to $10,000 and up, depending on scope. The real figure comes once I understand the project: see [How does a quote work?](/guides/how-a-quote-works)',
      },
      { type: 'h2', text: 'Three questions to decide' },
      {
        type: 'ol',
        items: [
          'Will your customers use it more than once a month? If not, a website.',
          'Does it need notifications, use without a signal, or the camera? If so, an app may be right.',
          'Do people still need to find you in the first place? Then start with the website, and add an app once there is something worth opening every week.',
        ],
      },
      {
        type: 'p',
        text: 'Many projects start as a website and add an app later on the same system behind it, so nothing built first is thrown away.',
      },
      {
        type: 'p',
        text: 'If you are still not sure, that is a normal place to start a conversation. Tell me what your customers do today, how often they come back, and what slows you down, and I will tell you plainly which one fits, even when the answer is the smaller, cheaper one.',
      },
    ],
    related: ['tap-to-tick', 'latin-game', 'ruta', 'delta'],
    sources: [SOURCES.appleFee, SOURCES.playFee],
  },
  {
    slug: 'how-a-quote-works',
    question: 'How does a quote work?',
    title: 'How a website or app quote works',
    description:
      'You tell me what you have in mind, we talk it through, and once I understand the project you get a plan and a quote. Rough ranges for websites and apps, what moves the price, and what to bring.',
    answer:
      'You tell me what you have in mind, we talk it through, and once I understand the project you get a clear plan and a quote. There is no price list and no pressure: every project is quoted on what it actually needs.',
    published: '2026-10-30',
    updated: '2026-10-30',
    keywords: ['website quote', 'app development quote', 'how much does a website cost', 'how much does an app cost', 'custom software quote'],
    body: [
      { type: 'h2', text: 'The four steps' },
      {
        type: 'ol',
        items: [
          'Tell me what you have in mind. A few lines on the [Start a conversation](/get-started) form, or an email, is plenty.',
          'We talk it through. You talk to me directly, the person who builds it: what it has to do, who it is for, and what you use today.',
          'A plan and a quote. Once I understand the project, you get a plan in plain words: what will be built, in what order, and what it costs.',
          'I build it with you. You see it as it takes shape, it goes live, and I stay for the fixes and the next version.',
        ],
      },
      { type: 'h2', text: 'Why there is no price list' },
      {
        type: 'p',
        text: 'Two projects that sound the same can be very different underneath. “A website for my school” might be five pages, or it might be class sign-ups, payments and a roster for every teacher. A price list would either charge the first too much or quote the second too little. Talking first means the quote fits the project you actually have, and you know exactly what it covers before anything starts.',
      },
      { type: 'h2', text: 'Rough ranges, to give a sense of scale' },
      { type: 'p', text: 'These are ranges, not a quote:' },
      {
        type: 'ul',
        items: [
          'A basic website: around $1,000 to $2,000',
          'A basic mobile app: around $3,000 to $5,000',
          'More complex projects: around $6,000 to $10,000 and up, depending on scope',
        ],
      },
      {
        type: 'p',
        text: 'A typical website takes a few weeks, and an app a few months, depending on scope.',
      },
      { type: 'h2', text: 'What moves the price' },
      {
        type: 'ul',
        items: [
          'How many different pages or screens it has',
          'Sign-in and accounts, and how many kinds of user (a family, a teacher, an office)',
          'Payments, subscriptions and refunds',
          'Connections to tools you already use: a calendar, email, accounting',
          'Publishing to the App Store and Google Play',
          'Moving existing records in from a spreadsheet or an old system',
          'Whether the words and photos are ready, or still to be written',
        ],
      },
      { type: 'h2', text: 'What helps the first conversation' },
      {
        type: 'ul',
        items: [
          'What you do today, and what is slow or painful about it',
          'Who will use it, and on what: a phone, a computer, both',
          'A website or app you like, and what you like about it',
          'Any date that matters: a term start, a season, a launch',
          'A budget range, if you have one, so I can suggest what fits it',
        ],
      },
      {
        type: 'p',
        text: 'None of this needs to be polished. Half a page of notes, or a voice memo’s worth of talking, is a good start.',
      },
      { type: 'h2', text: 'After launch' },
      {
        type: 'p',
        text: 'I build it and I maintain it, so looking after it is part of the plan from the start. For apps, some running costs are set by Apple, Google and the hosting companies, not by me: [What does it cost to keep an app running after launch?](/guides/cost-to-keep-an-app-running) lists them with their sources.',
      },
      {
        type: 'p',
        text: 'Churches, ministries and missionaries raising support get their website built for free; my time is the donation ([my mission](/mission)). If you are not yet sure whether you need a website or an app, start with [Website or app: which does my business need?](/guides/website-or-app)',
      },
    ],
    related: ['farzana', 'ruta', 'tap-to-tick'],
  },
  {
    slug: 'cost-to-keep-an-app-running',
    question: 'What does it cost to keep an app running after launch?',
    title: 'What it costs to keep an app running after launch',
    description:
      'The real running costs of an app: Apple’s 99 USD a year, Google Play’s one-time 25 USD, the stores’ share of sales, hosting and database plans, and the yearly updates Apple and Google require. With sources.',
    answer:
      'The fixed fees are small and public: Apple’s developer program is 99 USD a year, a Google Play account is a one-time 25 USD, and hosting and a database can start free and grow with use. The larger cost is keeping the app updated, because Apple and Google require apps to keep up with new phone systems, and an app nobody updates is eventually left behind.',
    published: '2026-10-30',
    updated: '2026-10-30',
    keywords: [
      'cost to maintain an app',
      'app maintenance cost',
      'Apple developer fee',
      'Google Play developer fee',
      'app hosting cost',
    ],
    body: [
      { type: 'h2', text: 'The store fees' },
      {
        type: 'ul',
        items: [
          'Apple Developer Program: 99 USD per membership year ([Apple](https://developer.apple.com/programs/enroll/)). Nonprofits, accredited schools and government bodies that sell nothing through their apps can ask Apple for a fee waiver ([Apple](https://developer.apple.com/help/account/membership/fee-waivers)).',
          'Google Play: a one-time 25 USD registration fee ([Google](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)).',
        ],
      },
      { type: 'h2', text: 'The stores’ share of sales' },
      {
        type: 'p',
        text: 'If the app sells something digital inside it, such as a subscription, a course or a level, the store takes a share. Apple’s Small Business Program charges 15% for developers with up to 1 million USD a year in proceeds ([Apple](https://developer.apple.com/app-store/small-business-program/)). Google Play’s rates depend on the kind of purchase and where the customer is; for US subscriptions, its table lists 10% plus a 5% billing fee on the first 1 million USD a year ([Google](https://support.google.com/googleplay/android-developer/answer/112622?hl=en)).',
      },
      {
        type: 'p',
        text: 'Real-world goods and services, like a lawn visit or a class taught in person, are paid by card instead, through a payment company. Stripe’s standard US rate is 2.9% + 30¢ per successful card payment ([Stripe](https://stripe.com/pricing)).',
      },
      { type: 'h2', text: 'Hosting and the database' },
      {
        type: 'p',
        text: 'Most apps have a server and a database behind them: accounts, saved data, payments. For a small app this can start free. Two public examples: Vercel’s Hobby plan is free and its Pro plan is 20 USD a month per developer seat ([Vercel](https://vercel.com/pricing)); Supabase’s free plan pauses a project after a week without activity, and its Pro plan starts at 25 USD a month ([Supabase](https://supabase.com/pricing)). An app with real users should not sit on a plan that can pause. These costs grow with use: more people, more storage, more email.',
      },
      { type: 'h2', text: 'Updates you cannot skip' },
      {
        type: 'p',
        text: 'Apple and Google move the ground every year. Since April 28, 2026, every app uploaded to Apple must be built with Xcode 26 and the iOS 26 tools ([Apple](https://developer.apple.com/news/upcoming-requirements/)). On Google Play, from August 31, 2026, new apps and updates must target Android 16, and existing apps must target at least Android 15 to stay available to new users ([Google](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)).',
      },
      {
        type: 'p',
        text: 'An app that is not kept up to date slowly stops being offered to people on newer phones. And when something does break, a fix cannot ship until the app has been brought up to date first, which is the worst time to find out.',
      },
      {
        type: 'p',
        text: 'There are smaller running costs too:',
      },
      {
        type: 'ul',
        items: [
          'The domain name, renewed every year',
          'An email service for receipts and sign-in codes',
          'Error reporting, so you hear about a crash before a customer tells you',
          'Security updates to the building blocks the app is made from',
        ],
      },
      { type: 'h2', text: 'And someone’s time' },
      {
        type: 'p',
        text: 'The fees above are the easy part to plan for. The bigger part is time: applying the yearly updates, fixing what a new phone breaks, answering the stores’ review notes, and adding what users ask for. I build it and I maintain it, so looking after the app is part of the plan from the start, and its cost is part of the quote. See [How does a quote work?](/guides/how-a-quote-works)',
      },
      { type: 'h2', text: 'A simple way to budget' },
      {
        type: 'ul',
        items: [
          'Fixed: Apple 99 USD a year, Google 25 USD once, the domain name',
          'Grows with use: hosting, database, email, and the store’s or card company’s share of sales',
          'Time: the yearly updates, fixes and new features',
        ],
      },
      {
        type: 'p',
        text: 'If your plans do not need an app yet, a website avoids most of this list: see [Website or app: which does my business need?](/guides/website-or-app)',
      },
    ],
    related: ['tap-to-tick', 'latin-game', 'ruta'],
    sources: [
      SOURCES.appleFee,
      SOURCES.appleWaiver,
      SOURCES.appleSmallBusiness,
      SOURCES.appleUpcoming,
      SOURCES.playFee,
      SOURCES.playService,
      SOURCES.playTarget,
      SOURCES.stripe,
      SOURCES.vercel,
      SOURCES.supabase,
    ],
  },
]

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug)
}

/* A related project's link stays on this site: the Portfolio section for the
   projects that live elsewhere (farzana.app, kcupgs.com, the Delta site). */
const PORTFOLIO_ANCHOR: Record<string, string> = {
  farzana: '/portfolio#farzana',
  kcupg: '/portfolio#more',
  delta: '/portfolio#more',
}

export function relatedProjects(guide: Guide) {
  return guide.related.flatMap((slug) => {
    const p = PROJECTS.find((x) => x.slug === slug)
    if (!p) return []
    return [{ name: p.name, line: p.line, href: PORTFOLIO_ANCHOR[slug] ?? p.href ?? '/portfolio' }]
  })
}

export function formatGuideDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}
