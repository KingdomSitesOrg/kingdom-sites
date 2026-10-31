/**
 * The work, in one place, for the home page directions (T-358).
 *
 * Every line here is checked against the product itself or its own site:
 * the Farzana Classroom screens are captures of the running app, shown with
 * Wren Hall, a made-up demo school (its name, crest and figures are demo data,
 * so nothing is blurred and no client is shown); the Ruta screens are the crew
 * app's own App Store pictures, cropped to the screen, with their demo data;
 * the KCUPG dashboard and map are captures of the live kcupgs.com (counts by
 * region, and businesses and places of worship only, no people's details);
 * the case-study cards are captures of each live site; and the Delta wording
 * comes from deltadevelopmentproject.com. No invented numbers, no client
 * quotes nobody said.
 */

export type Shot = { src: string; alt: string; w: number; h: number }

export const SHOTS = {
  farzanaHome: { src: '/work/farzana-home.jpg', alt: 'Farzana Classroom, a demo school’s Home: an AI assistant, 248 students, 131 active this week, and its classes', w: 1800, h: 1125 },
  farzanaHomePhone: { src: '/work/farzana-home-phone.jpg', alt: 'The same school’s Home on a phone', w: 780, h: 1688 },
  farzanaStudents: { src: '/work/farzana-students.jpg', alt: 'Farzana Classroom, a demo school’s student list, with search and filters', w: 1800, h: 1125 },
  farzanaStudentsPhone: { src: '/work/farzana-students-phone.jpg', alt: 'The student list on a phone', w: 780, h: 1688 },
  farzanaClasses: { src: '/work/demo-classes.jpg', alt: 'Farzana Classroom, a demo school’s public list of classes, each with its price', w: 1800, h: 1125 },
  farzanaClass: { src: '/work/demo-class.jpg', alt: 'Farzana Classroom, a demo school’s page for its Backyard astronomy class, with a free sample to try', w: 1800, h: 1125 },
  farzanaClassPhone: { src: '/work/demo-class-phone.jpg', alt: 'The same class page on a phone', w: 780, h: 1688 },
  farzanaDesk: { src: '/work/demo-desk.jpg', alt: 'Farzana Classroom, a demo school’s analytics: 248 students, 131 active this week, the newest students', w: 1800, h: 1125 },
  latinHome: { src: '/jam-legio/home.jpg', alt: 'JAM Legio, the home screen', w: 660, h: 1434 },
  latinMap: { src: '/jam-legio/map.jpg', alt: 'JAM Legio, the journey map across the Roman world', w: 660, h: 1434 },
  latinCase: { src: '/jam-legio/case-challenge.jpg', alt: 'JAM Legio, a case challenge', w: 660, h: 1434 },
  latinBoard: { src: '/jam-legio/leaderboard.jpg', alt: 'JAM Legio, the leaderboard', w: 660, h: 1434 },
  tapOverview: { src: '/tap-to-tick/overview.jpg', alt: 'Tap to Tick, a month of spending at a glance', w: 644, h: 1400 },
  tapLog: { src: '/tap-to-tick/log.jpg', alt: 'Tap to Tick, logging a purchase', w: 644, h: 1400 },
  rutaQueue: { src: '/work/ruta-crew-queue.jpg', alt: 'Ruta’s crew app, the day’s visits in order, with the next one in progress', w: 660, h: 1434 },
  rutaVisit: { src: '/work/ruta-crew-visit.jpg', alt: 'Ruta’s crew app, one visit: the job, its details and the Complete button', w: 660, h: 1434 },
  rutaTime: { src: '/work/ruta-crew-time.jpg', alt: 'Ruta’s crew app, the time clock with the hours worked this week', w: 660, h: 1434 },
  kcupgDashboard: { src: '/work/kcupg-dashboard.jpg', alt: 'KCUPG’s dashboard: Kansas City’s communities at a glance, with people, mapped places and census areas, and each region by size', w: 1800, h: 1125 },
  kcupgMap: { src: '/work/kcupg-map.jpg', alt: 'KCUPG’s South Asia map of Kansas City: Indian places pinned across the metro, with filters by country and kind of place, and an Ask anything bar', w: 1440, h: 900 },
  deltaSite: { src: '/work/cards/delta.jpg', alt: 'The Delta Development Project website’s home page: children in a village school', w: 960, h: 600 },
} satisfies Record<string, Shot>

/* JAM Legio's store listings. The addresses are the stores' own and stay as
   they are. */
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
  /** Where its card leads: its page on this site when it has one. */
  href?: string
  /** The live product or site, when it lives somewhere else. */
  site?: string
  /** A capture of the live site or app, for its card on the Portfolio page. */
  card?: Shot
}

export const PROJECTS: Project[] = [
  {
    slug: 'farzana',
    name: 'Farzana Classroom',
    kind: 'Platform',
    forWhom: 'Schools and education businesses',
    line: 'Education software for schools, training organizations, education businesses or anyone who teaches classes, customized to your needs.',
    platforms: 'Web, phone and desktop',
    status: 'In beta, first school coming soon',
    href: '/portfolio/farzana-classroom',
    site: 'https://farzana.app',
  },
  {
    slug: 'jam-legio',
    name: 'JAM Legio',
    kind: 'App',
    forWhom: 'Latin students',
    line: 'A Latin learning game. Students travel the Roman world city by city, answer case challenges and race each other on the leaderboard.',
    platforms: 'iPhone and Android',
    status: 'On the App Store and Google Play',
    href: '/jam-legio',
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
    line: 'Contract work on a live platform: the office app, the customer portal and the crew’s phone app.',
    platforms: 'Web, iPhone and Android',
    status: 'Live',
    href: '/ruta',
  },
  {
    slug: 'delta',
    name: 'Delta Development Project',
    kind: 'Website',
    forWhom: 'A project of SIM Bangladesh',
    line: 'Village schools, vocational training and disaster response in northern Bangladesh and Dhaka.',
    platforms: 'Web',
    status: 'Live',
    href: '/portfolio/delta',
    site: 'https://deltadevelopmentproject.com',
    card: { src: '/work/cards/delta.jpg', alt: 'The Delta Development Project website: children in a village school', w: 960, h: 600 },
  },
  {
    slug: 'kcupg',
    name: 'KCUPG',
    kind: 'Website',
    forWhom: 'Kansas City',
    line: 'Kansas City’s communities from North Africa to East Asia on one map: people, languages and faith.',
    platforms: 'Web',
    status: 'Live',
    href: '/portfolio/kcupg',
    site: 'https://kcupgs.com',
    card: { src: '/work/cards/kcupg.jpg', alt: 'The KCUPG dashboard: Kansas City’s communities at a glance, by region', w: 960, h: 600 },
  },
  {
    slug: 'prayer',
    name: 'Prayer',
    kind: 'Website',
    forWhom: 'Churches and small groups',
    line: 'I made a weekly prayer meeting kit for the unreached: a verse, a story, prayer points and free guides.',
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
    line: 'I make short, hand-drawn walkthroughs of Bible books, in English and Bangla, free to watch and share.',
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
    body: 'A site that says what you do, shows up in search, and that you can update yourself.',
  },
  {
    title: 'iPhone and Android apps',
    body: 'Designed, built and published on the App Store and Google Play under your name, and kept working as phones update.',
  },
  {
    title: 'AI consultation',
    body: 'I help you use AI to bring in more revenue, save time and grow your business. I have built AI into this website, Ruta and Farzana.',
    href: '/ai-tooling',
  },
] satisfies { title: string; body: string; href?: string }[]

/**
 * The maker's credit for each product the home page shows: what I made, and
 * what it does for the people who use it (T-372). Outcomes only, no numbers:
 * none of these products has a measured figure to quote yet.
 */
export type Made = { name: string; text: string }

export const MADE = {
  farzana: {
    name: 'Farzana Classroom',
    text: 'I built this from the ground up as a stable, quality, easy-to-navigate classroom app. Everything is stitched together, from payments to quiz results.',
  },
} satisfies Record<string, Made>

/** The business case, said plainly, before the closing call (T-372; wording replaced T-374). */
export const PAYS = [
  {
    title: 'Take payments online, any time.',
    body: 'Customers book and pay without you at a desk.',
  },
  {
    title: 'Spend less time on paperwork.',
    body: 'Forms, lists and reminders live in one place that updates itself.',
  },
  {
    title: 'Serve more people without hiring more staff.',
    body: 'The routine work runs itself, so the same team does more.',
  },
  {
    title: 'Own your data and your customer list.',
    body: 'Your name, your customers, your data, on software built around how you work.',
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
  { title: 'You and I talk it through', body: 'You talk to Thomas, the person who builds it. I ask what it has to do, and for whom.' },
  { title: 'A plan and a quote', body: 'Once I understand the project, you get a clear plan and a quote. No pressure.' },
  { title: 'Built, launched, looked after', body: 'I build it with you, put it live, and stay for the fixes and the next version.' },
]
