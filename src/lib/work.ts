/**
 * The work, in one place, for the home page directions (T-358).
 *
 * Every line here is checked against the product itself or its own site:
 * the Farzana Classroom screens are captures of the running app, shown with
 * Wren Hall, a made-up demo school (its name, crest and figures are demo data,
 * so nothing is blurred and no client is shown); the Ruta screens are the crew
 * app's own App Store pictures, cropped to the screen, with their demo data;
 * the KCUPG dashboard is a capture of the live kcupgs.com (counts by region,
 * no people's details);
 * the case-study cards are captures of each live site; and the Delta wording
 * comes from deltadevelopmentproject.com. No invented numbers, no client
 * quotes nobody said.
 */

export type Shot = { src: string; alt: string; w: number; h: number }

export const SHOTS = {
  farzanaHome: { src: '/work/farzana-home.jpg', alt: 'Farzana Classroom, a demo school’s Home: Ask Otus, 248 students, 131 active this week, and its classes', w: 1800, h: 1125 },
  farzanaHomePhone: { src: '/work/farzana-home-phone.jpg', alt: 'The same school’s Home on a phone', w: 780, h: 1688 },
  farzanaStudents: { src: '/work/farzana-students.jpg', alt: 'Farzana Classroom, a demo school’s student list, with search and filters', w: 1800, h: 1125 },
  farzanaStudentsPhone: { src: '/work/farzana-students-phone.jpg', alt: 'The student list on a phone', w: 780, h: 1688 },
  farzanaClasses: { src: '/work/demo-classes.jpg', alt: 'Farzana Classroom, a demo school’s public list of classes, each with its price', w: 1800, h: 1125 },
  farzanaClass: { src: '/work/demo-class.jpg', alt: 'Farzana Classroom, a demo school’s page for its Backyard astronomy class, with a free sample to try', w: 1800, h: 1125 },
  farzanaClassPhone: { src: '/work/demo-class-phone.jpg', alt: 'The same class page on a phone', w: 780, h: 1688 },
  farzanaDesk: { src: '/work/demo-desk.jpg', alt: 'Farzana Classroom, a demo school’s analytics: 248 students, 131 active this week, the newest students', w: 1800, h: 1125 },
  latinHome: { src: '/latin-game/home.jpg', alt: 'A Latin learning game, the home screen', w: 660, h: 1434 },
  latinMap: { src: '/latin-game/map.jpg', alt: 'A Latin learning game, the journey map across the Roman world', w: 660, h: 1434 },
  latinCase: { src: '/latin-game/case-challenge.jpg', alt: 'A Latin learning game, a case challenge', w: 660, h: 1434 },
  latinBoard: { src: '/latin-game/leaderboard.jpg', alt: 'A Latin learning game, the leaderboard', w: 660, h: 1434 },
  tapOverview: { src: '/tap-to-tick/overview.jpg', alt: 'Tap to Tick, a month of spending at a glance', w: 644, h: 1400 },
  tapLog: { src: '/tap-to-tick/log.jpg', alt: 'Tap to Tick, logging a purchase', w: 644, h: 1400 },
  rutaQueue: { src: '/work/ruta-crew-queue.jpg', alt: 'Ruta’s crew app, the day’s queue of visits with a Clock in button', w: 718, h: 1332 },
  rutaVisit: { src: '/work/ruta-crew-visit.jpg', alt: 'Ruta’s crew app, one visit: the crew, an admin note and an aerial view of the property', w: 718, h: 1332 },
  rutaTime: { src: '/work/ruta-crew-time.jpg', alt: 'Ruta’s crew app, the time clock with the hours worked this week', w: 718, h: 1332 },
  kcupgDashboard: { src: '/work/kcupg-dashboard.jpg', alt: 'KCUPG’s dashboard: Kansas City’s communities at a glance, with people, mapped places and census areas, and each region by size', w: 1800, h: 1125 },
} satisfies Record<string, Shot>

/* The Latin learning game's store listings. The addresses are the stores' own
   and stay as they are; nothing on the page names the client. */
export const LATIN_STORES = {
  appStore: 'https://apps.apple.com/us/app/jam-legio/id6797884645',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.jamwithlatin.app',
}

export const PHOTOS = {
  thomasMonisha: { src: '/farzana/thomas-and-monisha.jpg', alt: 'Thomas and Monisha Klein at a table, smiling', w: 2000, h: 1506 },
  outdoors: { src: '/Photos/hero.jpeg', alt: 'Thomas and Monisha on a hillside', w: 960, h: 1280 },
  evening: { src: '/Photos/about.jpg', alt: 'Thomas and Monisha under string lights', w: 1120, h: 1400 },
  deltaSchool: { src: '/delta/content/primaryschool.jpeg', alt: 'Children in a Delta Development Project village school in Bangladesh', w: 1280, h: 853 },
  deltaTailoring: { src: '/delta/content/vocation.JPG', alt: 'A woman at a sewing machine in a Delta vocational training class', w: 960, h: 1280 },
  deltaRelief: { src: '/delta/content/releifONE.jpeg', alt: 'Relief supplies handed out in Bangladesh', w: 1280, h: 960 },
} satisfies Record<string, Shot>

export type Project = {
  slug: string
  name: string
  kind: string
  forWhom: string
  line: string
  platforms: string
  status: string
  href?: string
  /** A capture of the live site or app, for its card on the Portfolio page. */
  card?: Shot
}

export const PROJECTS: Project[] = [
  {
    slug: 'farzana',
    name: 'Farzana Classroom',
    kind: 'Platform',
    forWhom: 'Schools and education businesses',
    line: 'Education software for schools, training organizations and education businesses. One proven platform, with the features each school actually needs built on top.',
    platforms: 'Web, phone and desktop',
    status: 'In beta, first school coming soon',
    href: 'https://farzana.app',
  },
  {
    slug: 'latin-game',
    name: 'A Latin learning game',
    kind: 'App',
    forWhom: 'Latin students',
    line: 'A Latin learning game. Students travel the Roman world city by city, answer case challenges and race each other on the leaderboard.',
    platforms: 'iPhone and Android',
    status: 'On the App Store and Google Play',
    href: '/latin-game',
  },
  {
    slug: 'tap-to-tick',
    name: 'Tap to Tick',
    kind: 'App',
    forWhom: 'Anyone keeping a budget',
    line: 'An iPhone expense app. Log a purchase in one tap; see the month by account and category.',
    platforms: 'iPhone',
    status: 'Live',
    href: '/tap-to-tick',
    card: { src: '/work/cards/tap-to-tick.jpg', alt: 'Tap to Tick’s page: “Tap it. Tick it. Done.”', w: 960, h: 600 },
  },
  {
    slug: 'ruta',
    name: 'Ruta',
    kind: 'Contract',
    forWhom: 'Landscaping businesses',
    line: 'Contract work on a live service-management platform: the office app, the customer portal and the crew’s phone app.',
    platforms: 'Web, iPhone and Android',
    status: 'Live',
    href: '/ruta',
  },
  {
    slug: 'delta',
    name: 'Delta Development Project',
    kind: 'Website',
    forWhom: 'A project of SIM Bangladesh',
    line: 'The website for work with river-bank and urban communities in northern Bangladesh and Dhaka: village schools, vocational training, disaster response.',
    platforms: 'Web',
    status: 'Live',
    href: 'https://deltadevelopmentproject.com',
    card: { src: '/work/cards/delta.jpg', alt: 'The Delta Development Project website: children in a village school', w: 960, h: 600 },
  },
  {
    slug: 'kcupg',
    name: 'KCUPG',
    kind: 'Website',
    forWhom: 'Kansas City',
    line: 'A dashboard of Kansas City’s South Asian communities: people, languages and faith on one map.',
    platforms: 'Web',
    status: 'Live',
    href: 'https://kcupgs.com',
    card: { src: '/work/cards/kcupg.jpg', alt: 'The KCUPG dashboard: Kansas City’s communities at a glance, by region', w: 960, h: 600 },
  },
  {
    slug: 'prayer',
    name: 'Prayer',
    kind: 'Website',
    forWhom: 'Churches and small groups',
    line: 'A kit for a weekly prayer meeting for the unreached: a verse, a story, prayer points and free guides to download.',
    platforms: 'Web',
    status: 'Live',
    href: '/prayer',
    card: { src: '/work/cards/prayer.jpg', alt: 'The Prayer site: “Pray for the people who still have no one telling them.”', w: 960, h: 600 },
  },
  {
    slug: 'ministry',
    name: 'Ministry',
    kind: 'Website',
    forWhom: 'Anyone meeting the Bible for the first time',
    line: 'Short, hand-drawn walkthroughs of books of the Bible, in English and Bangla, free to watch, download and share.',
    platforms: 'Web',
    status: 'Live',
    href: '/ministry',
    card: { src: '/work/cards/ministry.jpg', alt: 'The Ministry site: “A book of the Bible in four minutes, in English and Bangla”', w: 960, h: 600 },
  },
  {
    slug: 'sign',
    name: 'Sign',
    kind: 'Tool',
    forWhom: 'Anyone sending agreements',
    line: 'Send a PDF agreement and have it signed online.',
    platforms: 'Web',
    status: 'Live',
    href: '/sign/pricing',
    card: { src: '/work/cards/sign.jpg', alt: 'Sign’s plans page: Sign Starter and Sign Growth', w: 960, h: 600 },
  },
]

/** What the studio makes, said the way a client would ask for it. */
export const OFFER = [
  {
    title: 'Websites',
    body: 'A site that says what you do, shows up when people search for it, and that you can keep up to date without calling anyone.',
  },
  {
    title: 'iPhone and Android apps',
    body: 'Designed, built and put on the App Store and Google Play under your name, then kept working through every new phone and system update.',
  },
  {
    title: 'The software behind them',
    body: 'Sign-in, payments, class lists, schedules, a dashboard for the office. The parts that make a site or an app actually run your work.',
  },
  {
    title: 'AI consultation',
    body: 'Helping you use AI well: where it fits in your work, setting it up, and building it into the tools you already use.',
    href: '/ai-tooling',
  },
] satisfies { title: string; body: string; href?: string }[]

/**
 * The maker's credit for each product the home page shows: what I made, and
 * what it does for the people who use it (T-372). Outcomes only, no numbers:
 * none of these products has a measured figure to quote yet.
 */
export const MADE = {
  farzana: {
    name: 'Farzana Classroom',
    made: 'The design, the web app, sign-in, payments and the teacher’s desk.',
    gives: 'Families find a class, try it and pay online at any hour, and the school sees every student on one screen.',
  },
  latin: {
    name: 'The Latin learning game',
    made: 'The design, the iPhone and Android apps, the levels and the leaderboard.',
    gives: 'Daily practice that feels like a game, and a programme on the App Store and Google Play, where new families can find it.',
  },
  kcupg: {
    name: 'KCUPG',
    made: 'The design, the dashboard, and the map of the city’s communities and the places to meet them.',
    gives: 'Churches and ministries in Kansas City see which communities live where, and where to meet them, in one place.',
  },
} satisfies Record<string, { name: string; made: string; gives: string }>

/** The business case, said plainly, before the closing call (T-372). */
export const PAYS = [
  {
    title: 'Take the money online.',
    body: 'Customers, families and members sign up, book and pay at any hour, without anyone at a desk to take it.',
  },
  {
    title: 'Give the hours back.',
    body: 'The forms, lists and reminders kept by hand move into one place that keeps itself up to date.',
  },
  {
    title: 'Grow without the paperwork growing.',
    body: 'A business, a school or a church can serve more people with the same team when the routine work runs itself.',
  },
  {
    title: 'Own what you grow on.',
    body: 'Your name, your customers and your data, on software shaped to how you already work.',
  },
]

export const AUDIENCES = [
  {
    title: 'Businesses',
    body: 'A site that brings in work, or the app your customers keep asking for.',
  },
  {
    title: 'Churches and ministries',
    body: 'Ministries, missionaries raising support and churches get their website built for free. The domain and hosting stay in your name.',
  },
  {
    title: 'Schools',
    body: 'Classes, students, families and payments in one place, on Farzana Classroom, shaped to how your school already works.',
  },
]

export const STEPS = [
  { title: 'Tell me what you have in mind', body: 'A few lines is plenty. A site, an app, or a problem you keep working around.' },
  { title: 'You and I talk it through', body: 'You talk to the person who builds it. I ask what it has to do, and for whom.' },
  { title: 'A plan and a quote', body: 'Once I understand the project, you get a clear plan and a quote. No pressure.' },
  { title: 'Built, launched, looked after', body: 'I build it with you, put it live, and stay for the fixes and the next version.' },
]
