/**
 * One page per project that had none on this site (T-389): Farzana Classroom,
 * KCUPG and the Delta Development Project, at /portfolio/<slug>.
 *
 * "The problem" on each page is Thomas's own words (2026-10-30). Everything
 * else is facts only, from the product itself or from this site: Farzana
 * Classroom's from the demo school's screens; KCUPG's from kcupgs.com and its repository (six
 * regions, Census figures, no sign-in); Delta's from deltadevelopmentproject.com
 * (its eight activities, gallery and contact form); how long each took and
 * who uses it from Thomas (2026-10-30). No invented numbers, no client quotes. Every sentence here is listed in docs/wording-pass-2.md for
 * Thomas to read.
 *
 * T-534 (2026-11-12): every project in the portfolio has a page here, and every
 * page ends its story with "How this applies to you". The seven new pages take
 * their facts from each project's own page on this site (/latin-game,
 * /tap-to-tick, /ruta, /prayer, /ministry, /sign, /strata); a part with no
 * source (how long it took, results, some problems) is left out. Their wording
 * is in docs/wording-pass-3.md.
 */
import { LATIN_STORES, PHOTOS, PROJECTS, SHOTS, type Shot } from '@/lib/work'

export type Figure = {
  shot: Shot
  /** Drawn in the browser window: the product's name in the address bar. */
  product?: string
  note?: string
  title: string
  caption: string
}

export type Quote = { text: string; who: string }

export type CaseStudy = {
  slug: string
  path: string
  name: string
  /** The page's title in search; the template adds " | Kingdom Sites". */
  title: string
  description: string
  /** The share card's own title and picture (public/share, scripts/case-cards.mjs). */
  shareTitle: string
  shareImage: string
  kind: string
  intro: string
  facts: [string, string][]
  /** The live product or site, when it lives somewhere else. */
  site?: { href: string; label: string }
  /** More ways on from the write-up: the stores, and the project's own page on this site. */
  links?: { href: string; label: string }[]
  /** JAM Legio's partnership credit, the one line that may name the partner. */
  partner?: boolean
  hero: Figure
  /** A phone app's screens, shown in the hero in place of the browser window. */
  phones?: Shot[]
  /** Left out where Thomas has not said what the problem was; `problemTitle`
      replaces the heading where there was no problem to solve (STRATA). */
  problem?: string[]
  problemTitle?: string
  /** `title` replaces "What I built" where I did not build it alone (Ruta). */
  built: { title?: string; lead: string; list: string[] }
  /** How long it took. A part Thomas has not given is left out, never guessed
      (Thomas, T-389); `title` replaces the heading where the honest answer is
      something else, as Farzana Classroom's "Coming soon". */
  took?: { title?: string; text: string[] }
  /** What improved after launch. */
  result?: string[]
  /** What the client says, in their words, with their OK. */
  quote?: Quote
  /** How this applies to the reader: two to four short sentences (T-534). */
  applies: string[]
  figures: Figure[]
  /** Slugs from PROJECTS, shown as "More from my portfolio". */
  related: string[]
}

const FARZANA = 'Farzana Classroom'
const project = (slug: string) => PROJECTS.find((p) => p.slug === slug)!

export const CASE_STUDIES = {
  'farzana-classroom': {
    slug: 'farzana-classroom',
    path: '/portfolio/farzana-classroom',
    name: 'Farzana Classroom',
    title: 'Farzana Classroom — school software for classes, sign-ups and payments',
    description:
      'Farzana Classroom is education software I built from the ground up for schools, co-ops and anyone who teaches classes: class sign-ups, families and online payments in one place.',
    shareTitle: 'Farzana Classroom — software for schools, built by Thomas Klein',
    shareImage: '/share/farzana-classroom.jpg',
    kind: 'Platform',
    intro:
      'Education software for schools, training organizations, education businesses or anyone who teaches classes, customized to your needs.',
    facts: [
      ['For', 'Schools and education businesses'],
      ['Made', 'Designed and built by me'],
      ['Runs on', 'Web, phone and desktop'],
      ['Status', 'In beta, first school coming soon'],
    ],
    site: { href: 'https://farzana.app', label: 'farzana.app' },
    hero: { shot: SHOTS.appClass, product: FARZANA, title: 'A class', caption: '' },
    problem: [
      'Some platforms take a cut of every class you sell, on top of payment fees and software fees.',
      'And running email campaigns, managing students, payments and products is hard when it is spread across different tools. Farzana Classroom combines it all.',
    ],
    built: {
      lead: 'I built this from the ground up as a stable, quality, easy-to-navigate classroom app. Everything is stitched together, from payments to quiz results.',
      list: [
        'A public list of classes, each with its price, and a free sample to try.',
        'Families sign up and pay online, at any hour.',
        'The teacher sees who is enrolled, who was active this week and who just joined.',
        'An AI assistant on every school’s Home.',
        'It runs on the web, on phones and on desktop.',
      ],
    },
    /* Not launched yet: no build time, result or quote (Thomas, T-389). */
    took: {
      title: 'Coming soon',
      text: [
        'Farzana Classroom is coming soon, and I welcome custom builds on top of it.',
        'The schools and students on these screens are made up, so no real family is shown.',
      ],
    },
    applies: [
      'If you teach classes and your sign-ups, payments and emails live in different tools, Farzana Classroom puts them in one place.',
      'I welcome custom builds on top of it, so it can be shaped to how your school already works.',
    ],
    figures: [
      {
        shot: SHOTS.farzanaClass,
        product: FARZANA,
        title: 'A class page',
        caption: 'What a family sees: the class, its price, and a free sample to try before signing up.',
      },
      {
        shot: SHOTS.appStudents,
        product: FARZANA,
        title: 'The student list',
        caption: 'What the teacher sees: every student, with search and filters.',
      },
    ],
    related: ['latin-game', 'kcupg', 'tap-to-tick'],
  },

  kcupg: {
    slug: 'kcupg',
    path: '/portfolio/kcupg',
    name: 'KCUPG',
    title: 'KCUPG — a map of Kansas City’s communities for local ministry',
    description:
      'KCUPG is a dashboard and map I designed and built for local ministry in Kansas City: the city’s communities from North Africa to East Asia, their languages and faiths, and the places to meet them.',
    shareTitle: 'KCUPG — Kansas City’s communities on one map',
    shareImage: '/share/kcupg.jpg',
    kind: 'Website',
    intro:
      'For local ministry in Kansas City, I built a dashboard of the city’s communities from North Africa to East Asia: people, languages and faiths, and the places to meet them, on one map.',
    facts: [
      ['For', 'Local ministry in Kansas City'],
      ['Made', 'Designed and built by me'],
      ['Runs on', 'Web, no sign-in'],
      ['Status', 'Live'],
    ],
    site: { href: 'https://kcupgs.com', label: 'kcupgs.com' },
    hero: { shot: SHOTS.kcupgDashboard, product: 'KCUPG', title: 'The dashboard', caption: '' },
    problem: [
      'Many different people are trying to reach the unreached in Kansas City, in many different places. No one knows everything, and many people know very little.',
      'We needed one place to bring together what we all know: the places, the pins on the map, how to get there and where everything is.',
    ],
    built: {
      lead: 'I built the dashboard and the map.',
      list: [
        'A dashboard of the whole metro, every region side by side. Tap a bar and that region’s map opens with the filter already on.',
        'Six regions: South Asia, Central Asia, the Middle East, North Africa, Southeast Asia and East Asia, each with its own dashboard, map and assistant.',
        'A map of real places to meet people, from restaurants and grocers to places of worship and campuses, filtered by country and kind of place.',
        'Search by place, language or neighborhood, or ask the assistant a question in plain words.',
        'People counts from the US Census Bureau’s American Community Survey, one table per region, so nobody is counted twice.',
      ],
    },
    took: { text: ['Built in two weeks, and updated every week with more information.'] },
    result: [
      'KCUPG is live at kcupgs.com, free to use, with no sign-in. It started as a map of the city’s South Asian communities and now covers six regions.',
      'Churches in Kansas City see which communities live where, and where to meet them. Logan, a full-time missionary in Kansas City, Missouri, uses it.',
    ],
    /* No quote yet: Logan will leave a Google review; quote it here
       once it exists, with his OK (docs/wording-pass-2.md). */
    applies: [
      'If what your church, ministry or business knows is spread across many people, I can bring it together in one place: a map, a dashboard, a search box.',
      'Anyone can open it, with no sign-in, and it can be updated every week as you learn more.',
    ],
    figures: [
      {
        shot: SHOTS.kcupgMap,
        product: 'KCUPG',
        title: 'The map',
        caption: 'Places pinned across the metro, filtered by country and kind of place, with an Ask anything bar.',
      },
    ],
    related: ['prayer', 'delta', 'farzana'],
  },

  delta: {
    slug: 'delta',
    path: '/portfolio/delta',
    name: 'Delta Development Project',
    title: 'Delta Development Project — a website for a mission project in Bangladesh',
    description:
      'The website I designed and built for the Delta Development Project, a project of SIM Bangladesh: village schools, vocational training and disaster response, with a page for each activity, a gallery and a contact form.',
    shareTitle: 'Delta Development Project — a website by Thomas Klein',
    shareImage: '/share/delta.jpg',
    kind: 'Website',
    intro:
      'Village schools, vocational training and disaster response in northern Bangladesh and Dhaka. I designed and built the project’s website.',
    facts: [
      ['For', 'A project of SIM Bangladesh'],
      ['Made', 'Designed and built by me'],
      ['Runs on', 'Web'],
      ['Status', 'Live'],
    ],
    site: { href: 'https://deltadevelopmentproject.com', label: 'deltadevelopmentproject.com' },
    hero: { shot: SHOTS.deltaSite, product: 'Delta Development Project', title: 'The home page', caption: '' },
    problem: [
      'My brother-in-law needed a website for his disaster relief and NGO work, so I built it for him in an affordable way.',
    ],
    built: {
      lead: 'I designed and built the website, around the project’s own photos.',
      list: [
        'A home page that says why the project is there and what it does.',
        'A page for each of its eight activities: primary school, vocational training, English training, sports, social awareness, computer training, environment care and disaster response.',
        'A gallery of the project’s own photos.',
        'An About page, and a contact form that goes straight to the project’s inbox.',
      ],
    },
    /* No time, result or quote confirmed: those parts are left out (Thomas, T-389). */
    applies: [
      'If your ministry, non-profit or small business needs a website and money is tight, this is what I can do: a clear home page, a page for each thing you do, your own photos, and a contact form that reaches your inbox.',
      'Ministries, missionaries raising support and churches get their website built for free.',
    ],
    figures: [
      { shot: PHOTOS.deltaSchool, title: 'Primary school', caption: 'A village school, from the project’s own photos.' },
      { shot: PHOTOS.deltaRelief, title: 'Disaster response', caption: 'Relief supplies handed out, from the project’s own photos.' },
    ],
    related: ['kcupg', 'ministry', 'farzana'],
  },
  'jam-legio': {
    slug: 'jam-legio',
    path: '/portfolio/jam-legio',
    name: 'JAM Legio',
    title: 'JAM Legio — how I built a Latin learning game for iPhone and Android',
    description:
      'JAM Legio is a Latin learning game I designed and built for iPhone and Android: thirteen stops from Rōma to Gallia, nine ways to drill the grammar, and a leaderboard to race each other on.',
    shareTitle: 'JAM Legio — a Latin learning game, built by Thomas Klein',
    shareImage: '/share/jam-legio.jpg',
    kind: 'App',
    intro: project('latin-game').line,
    facts: [
      ['For', project('latin-game').forWhom],
      ['Made', 'Designed and built by me'],
      ['Runs on', project('latin-game').platforms],
      ['Status', project('latin-game').status],
    ],
    links: [
      { href: LATIN_STORES.appStore, label: 'App Store' },
      { href: LATIN_STORES.googlePlay, label: 'Google Play' },
      { href: '/latin-game', label: 'See JAM Legio' },
    ],
    partner: true,
    hero: { shot: SHOTS.latinMap, title: 'The journey map', caption: '' },
    phones: [SHOTS.latinHome, SHOTS.latinMap, SHOTS.latinCase],
    problem: [
      'Latin grammar takes practice, and practice on paper feels like a worksheet.',
      'Students do it alone, and it usually takes a parent to keep them at it.',
    ],
    built: {
      lead: 'I designed and built the game for iPhone and Android, and published it on the App Store and Google Play.',
      list: [
        'A march north across Italy on a real map: thirteen stops from Rōma to Gallia, and every city teaches one piece of the classical curriculum.',
        'Nine ways to drill the grammar, from vocabulary cards and case challenges to reading short Latin sentences.',
        'Two camps on the road, where the legion reviews its noun endings and drills present-tense verbs.',
        'Coins for every level and city cleared, and a leaderboard to race each other on.',
        'The content follows the classical order: declensions, then verbs, then sentences.',
        'No email and no ads. The leaderboard shows only the name and picture a student chooses, and their progress.',
      ],
    },
    /* How long it took and results: not given yet, left out (T-534). */
    quote: {
      text: 'Hard worker, listens to our needs, creative and worked hard to get the project done both correctly and on time.',
      who: 'Alexis Carrico',
    },
    applies: [
      'If you teach something that takes daily practice, a game like this keeps people coming back without being told to.',
      'I can build one around your own material, for iPhone and Android, and publish it on the App Store and Google Play under your name.',
    ],
    figures: [],
    related: ['farzana', 'tap-to-tick', 'ruta'],
  },

  'tap-to-tick': {
    slug: 'tap-to-tick',
    path: '/portfolio/tap-to-tick',
    name: 'Tap to Tick',
    title: 'Tap to Tick — how I built an iPhone expense tracker',
    description:
      'Tap to Tick is an iPhone expense tracker I designed and built: log any transaction in two taps from the lock screen, including the cash in your pocket. Free, with a shared ledger for two people.',
    shareTitle: 'Tap to Tick — an iPhone expense tracker, built by Thomas Klein',
    shareImage: '/share/tap-to-tick.jpg',
    kind: 'App',
    intro: 'An iPhone expense tracker: log any transaction in two taps, including the cash in your pocket.',
    facts: [
      ['For', project('tap-to-tick').forWhom],
      ['Made', 'Designed and built by me'],
      ['Runs on', 'iPhone and Apple Watch'],
      ['Status', 'Free on the App Store'],
    ],
    links: [
      { href: 'https://apps.apple.com/us/app/tap-to-tick/id6791948663', label: 'App Store' },
      { href: '/tap-to-tick', label: 'See Tap to Tick' },
    ],
    hero: { shot: SHOTS.tapOverview, title: 'The month at a glance', caption: '' },
    phones: [SHOTS.tapOverview, SHOTS.tapLog, SHOTS.tapHistory],
    problem: [
      'A budget only works if every purchase gets written down. If that means unlocking the phone, hunting for an app or opening a spreadsheet, it does not happen.',
      'Cash is the part other apps miss. Pulling $100 from an ATM is not spending. It is moving money from the bank into your pocket.',
    ],
    built: {
      lead: 'I designed and built the app. It is free on the App Store.',
      list: [
        'A lock-screen widget with today’s running total: raise the phone, tap, enter the amount, pick a category.',
        'Three more ways in: Apple Pay, Apple Watch and Siri.',
        'Cash that adds up: a purchase paid with cash spends your wallet down, not your checking account.',
        'Rent, paychecks and subscriptions log themselves on the right day every month.',
        'The month as a ring by category, budgets with progress bars, and every balance on one screen.',
        'A shared ledger for two people, where every entry shows who logged it.',
        'No account, no ads, no tracking. Everything stays on your phone and in your own iCloud.',
      ],
    },
    /* How long it took and results: not given yet, left out (T-534). */
    applies: [
      'This matters for any app your customers or staff open many times a day: every step you remove decides whether they keep using it.',
      'If your team logs jobs, hours or orders on a phone, I can make that take two taps.',
    ],
    figures: [],
    related: ['latin-game', 'farzana', 'sign'],
  },

  ruta: {
    slug: 'ruta',
    path: '/portfolio/ruta',
    name: 'Ruta',
    title: 'Ruta — contract work on software for landscaping businesses',
    description:
      'Ruta is service-management software for landscaping and maintenance businesses. I helped build it as a contractor on Ruta’s team: billing, the crew’s phone app, office tools and the AI assistant.',
    shareTitle: 'Ruta — contract work by Thomas Klein',
    shareImage: '/share/ruta.jpg',
    kind: 'Contract',
    intro:
      'Ruta is service-management software for landscaping and maintenance businesses: an office app, a phone app for the crews, and a portal for customers. I helped build it as a contractor on Ruta’s team. The product is Ruta’s.',
    facts: [
      ['For', project('ruta').forWhom],
      ['Role', 'Helped build it, on Ruta’s team'],
      ['Runs on', project('ruta').platforms],
      ['Status', project('ruta').status],
    ],
    site: { href: 'https://getruta.com', label: 'getruta.com' },
    links: [{ href: '/ruta', label: 'More on Ruta' }],
    hero: { shot: SHOTS.rutaQueue, title: 'The crew app', caption: '' },
    phones: [SHOTS.rutaQueue, SHOTS.rutaVisit, SHOTS.rutaTime],
    /* The problem, how long and results: not given, left out (T-534). */
    built: {
      title: 'What I worked on',
      lead: 'I did not build it on my own: I helped build it as a contractor on Ruta’s team. Here are a few things I worked on.',
      list: [
        'Billing and payments.',
        'The crew app, including use without a signal.',
        'Office tools for scheduling, messaging and review.',
        'Customer self-service.',
        'The backend behind the apps.',
        'The AI assistant inside the product.',
      ],
    },
    applies: [
      'If you run crews in the field, I know this kind of software from the inside: schedules, visits, time clocks, billing, and a phone app that keeps working without a signal.',
      'I can build the same for your business, sized to how you work.',
    ],
    figures: [],
    related: ['farzana', 'latin-game', 'kcupg'],
  },

  prayer: {
    slug: 'prayer',
    path: '/portfolio/prayer',
    name: 'Prayer',
    title: 'Prayer — a weekly prayer meeting kit for the unreached',
    description:
      'Prayer is a website I made for churches and small groups: a weekly prayer meeting kit for the unreached, with a verse, a story, prayer points and free guides to download.',
    shareTitle: 'Prayer — a weekly prayer meeting kit, by Thomas Klein',
    shareImage: '/share/prayer.jpg',
    kind: 'Website',
    intro: project('prayer').line,
    facts: [
      ['For', project('prayer').forWhom],
      ['Made', 'Made by me'],
      ['Runs on', 'Web'],
      ['Status', 'Live, free to use'],
    ],
    links: [{ href: '/prayer', label: 'See Prayer' }],
    hero: { shot: project('prayer').card!, product: 'Prayer', title: 'The home page', caption: '' },
    problem: [
      'Most of the church prays for what it already sees. The unreached almost never make the prayer list, because almost nobody knows their names.',
      'The site began with a weekly prayer meeting for unreached nations. After a few approaches, a simple weekly guide stuck.',
    ],
    built: {
      lead: 'I made the site that shares that guide, so other people can start the same kind of night where they are.',
      list: [
        'Sample guides to download. Each is a full meeting: verse, story, quote, facts, praise, prayer points and one or two action items.',
        'One guide walked through on the page, so a leader sees the shape before downloading.',
        'A short leader guide: how to prepare, and the few terms every leader should know.',
        'A link to Joshua Project’s unreached people group of the day.',
        'A list of organizations worth knowing and giving to.',
      ],
    },
    /* How long it took and results: not given yet, left out (T-534). */
    applies: [
      'If your church or ministry has material that works in one room, a site like this puts it in every room that wants it, free to download and easy to lead from a phone.',
      'Ministries, missionaries raising support and churches get their website built for free.',
    ],
    figures: [],
    related: ['ministry', 'kcupg', 'delta'],
  },

  ministry: {
    slug: 'ministry',
    path: '/portfolio/ministry',
    name: 'Ministry',
    title: 'Ministry — Bible walkthrough videos in English and Bangla',
    description:
      'Ministry is a website I made for short, hand-drawn walkthroughs of books of the Bible, in English and Bangla, free to watch, download and share.',
    shareTitle: 'Ministry — Bible walkthroughs in English and Bangla, by Thomas Klein',
    shareImage: '/share/ministry.jpg',
    kind: 'Website',
    intro: project('ministry').line,
    facts: [
      ['For', project('ministry').forWhom],
      ['Made', 'Made by me'],
      ['Runs on', 'Web'],
      ['Status', 'Live, free to watch'],
    ],
    links: [{ href: '/ministry', label: 'See Ministry' }],
    hero: { shot: project('ministry').card!, product: 'Ministry', title: 'The home page', caption: '' },
    problem: [
      'Short, visual overviews of Scripture are easy to find in English and scarce almost everywhere else.',
      'Roughly 240 million people speak Bangla, and very little of this exists for them.',
    ],
    built: {
      lead: 'I make the walkthroughs, and I built the site they live on.',
      list: [
        'A hand-drawn walkthrough of Ephesians in about four minutes: who wrote it, what it says, and how the parts fit together.',
        'The same walkthrough in English and in Bangla: same drawings, same order, narrated and lettered in each language.',
        'Free to watch, download and share, so it can be passed on with no internet at all.',
        'More books are on the way.',
      ],
    },
    /* How long it took and results: not given yet, left out (T-534). */
    applies: [
      'A four-minute video travels further than a book: it plays on a phone, downloads, and passes from person to person.',
      'If the people you serve think in another language, I can help you put your teaching into it. Once the English version exists, a second language costs very little.',
    ],
    figures: [],
    related: ['prayer', 'delta', 'kcupg'],
  },

  sign: {
    slug: 'sign',
    path: '/portfolio/sign',
    name: 'Sign',
    title: 'Sign — a tool for signing PDF agreements online',
    description:
      'Sign is a tool I designed and built: send a PDF agreement, have each person sign it in their browser, and everyone gets the signed copy by email.',
    shareTitle: 'Sign — PDF agreements signed online, built by Thomas Klein',
    shareImage: '/share/sign.jpg',
    kind: 'Tool',
    intro: project('sign').line,
    facts: [
      ['For', project('sign').forWhom],
      ['Made', 'Designed and built by me'],
      ['Runs on', 'Web'],
      ['Status', project('sign').status],
    ],
    links: [{ href: '/sign/pricing', label: 'Sign plans' }],
    hero: { shot: project('sign').card!, product: 'Sign', title: 'The plans page', caption: '' },
    /* The problem, how long and results: not given, left out (T-534). */
    built: {
      lead: 'I built Sign into this website.',
      list: [
        'Upload a PDF and place the signature boxes on its pages.',
        'Each signer gets a private link by email and signs in the browser, with nothing to install.',
        'When everyone has signed, the signed PDF is emailed to every party.',
        'A record of each step is kept with the agreement.',
      ],
    },
    applies: [
      'If your business sends quotes, contracts or waivers, your customer can sign on a phone, and nobody prints or scans anything.',
      'I can build signing into your own website or app, so the agreement, the signature and the customer’s record stay in one place.',
    ],
    figures: [],
    related: ['tap-to-tick', 'farzana', 'strata'],
  },

  strata: {
    slug: 'strata',
    path: '/portfolio/strata',
    name: 'STRATA',
    title: 'STRATA — a concept site with a 3D film that plays as you scroll',
    description:
      'STRATA is a concept site I designed and built for a made-up 3D printing company: a printed part goes from idea to factory floor as you scroll, drawn in 3D in the browser.',
    shareTitle: 'STRATA — a concept site by Thomas Klein',
    shareImage: '/share/strata.jpg',
    kind: 'Concept site',
    intro: 'A concept site for a made-up 3D printing company. A printed part goes from idea to factory floor as you scroll.',
    facts: [
      ['For', 'A made-up 3D printing company'],
      ['Made', 'Designed and built by me'],
      ['Runs on', 'Web'],
      ['Status', 'Concept, not a client'],
    ],
    links: [{ href: '/strata', label: 'See STRATA' }],
    hero: { shot: project('strata').card!, product: 'STRATA', note: 'Concept', title: 'The printed part', caption: '' },
    problemTitle: 'Why I made it',
    problem: ['STRATA is not a client and not a real company. I made it to show what a film that plays as you scroll can do on a website.'],
    built: {
      lead: 'I designed and built the whole site.',
      list: [
        'A film in nine chapters that moves as you scroll: the idea, the model, the slicing, the print, the machines and the finished object.',
        'The part is drawn in 3D in the browser as you watch. It is not a video.',
        'Under the film, a full product page for the made-up company: features, pricing and questions.',
        'A label on the page says it is a concept.',
      ],
    },
    applies: [
      'If you sell something physical, a page like this lets a customer watch it being made instead of reading about it.',
      'The same approach works for a product, a building or a process.',
    ],
    figures: [],
    related: ['sign', 'tap-to-tick', 'delta'],
  },
} satisfies Record<string, CaseStudy>

export type CaseSlug = keyof typeof CASE_STUDIES
