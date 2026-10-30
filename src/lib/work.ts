/**
 * The work, in one place, for the home page directions (T-358).
 *
 * Every line here is checked against the product itself or its own site:
 * the Farzana and JAM Classes screens are captures of the running apps, the
 * Delta wording comes from deltadevelopmentproject.com. No invented numbers,
 * no client quotes nobody said.
 */

export type Shot = { src: string; alt: string; w: number; h: number }

export const SHOTS = {
  farzanaSite: { src: '/work/farzana-site.jpg', alt: 'Farzana’s home page: “Your organization is unique. Your software should be too.”', w: 1800, h: 1125 },
  farzanaSitePhone: { src: '/work/farzana-site-phone.jpg', alt: 'Farzana’s home page on a phone', w: 780, h: 1688 },
  farzanaStudents: { src: '/work/farzana-students.jpg', alt: 'Farzana’s student list, with search and filters', w: 1800, h: 1125 },
  farzanaStudentsPhone: { src: '/work/farzana-students-phone.jpg', alt: 'Farzana’s student list on a phone', w: 780, h: 1688 },
  jamAdminHome: { src: '/work/jam-admin-home.jpg', alt: 'JAM Classes, the teacher’s home, with the figures and class names blurred: students, weekly activity, sales and classes', w: 1800, h: 1125 },
  jamAdminClasses: { src: '/work/jam-admin-classes.jpg', alt: 'JAM Classes, the teacher’s list of classes, with the class names blurred', w: 1800, h: 1125 },
  jamClass: { src: '/work/jam-class.jpg', alt: 'A JAM Classes class page, with the class details blurred', w: 1800, h: 1125 },
  jamClassPhone: { src: '/work/jam-class-phone.jpg', alt: 'A JAM Classes class page on a phone, with the class details blurred', w: 780, h: 1688 },
  jamClasses: { src: '/work/jam-classes.jpg', alt: 'JAM Classes, the public list of classes, with the class details blurred', w: 1800, h: 1125 },
  latinHome: { src: '/latin-game/home.jpg', alt: 'Jam with Latin, the home screen', w: 660, h: 1434 },
  latinMap: { src: '/latin-game/map.jpg', alt: 'Jam with Latin, the journey map across the Roman world', w: 660, h: 1434 },
  latinCase: { src: '/latin-game/case-challenge.jpg', alt: 'Jam with Latin, a case challenge', w: 660, h: 1434 },
  latinBoard: { src: '/latin-game/leaderboard.jpg', alt: 'Jam with Latin, the leaderboard', w: 660, h: 1434 },
  tapOverview: { src: '/tap-to-tick/overview.jpg', alt: 'Tap to Tick, a month of spending at a glance', w: 644, h: 1400 },
  tapLog: { src: '/tap-to-tick/log.jpg', alt: 'Tap to Tick, logging a purchase', w: 644, h: 1400 },
} satisfies Record<string, Shot>

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
}

export const PROJECTS: Project[] = [
  {
    slug: 'farzana',
    name: 'Farzana',
    kind: 'Platform',
    forWhom: 'Schools and education businesses',
    line: 'Education software for schools, training organizations and education businesses. One proven platform, with the features each school actually needs built on top.',
    platforms: 'Web, phone and desktop',
    status: 'In beta, first school coming soon',
    href: 'https://farzana.app',
  },
  {
    slug: 'jam-classes',
    name: 'JAM Classes',
    kind: 'School',
    forWhom: 'JAM with Latin',
    line: 'An online school for a homeschool Latin programme, built on Farzana: classes, families and payments in one place.',
    platforms: 'Web, phone and desktop',
    status: 'Coming soon',
  },
  {
    slug: 'jam-with-latin',
    name: 'Jam with Latin',
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
]

export const AUDIENCES = [
  {
    title: 'Churches and ministries',
    body: 'Ministries, missionaries raising support and churches get their website built for free. The domain and hosting stay in your name.',
  },
  {
    title: 'Schools',
    body: 'Classes, students, families and payments in one place, on Farzana, shaped to how your school already works.',
  },
  {
    title: 'Small businesses',
    body: 'A site that brings in work, or the app your customers keep asking for.',
  },
]

export const STEPS = [
  { title: 'Tell us what you have in mind', body: 'A few lines is plenty. A site, an app, or a problem you keep working around.' },
  { title: 'We talk it through', body: 'You talk to the person who builds it. We ask what it has to do, and for whom.' },
  { title: 'A plan and a quote', body: 'Once we understand the project, you get a clear plan and a quote. No pressure.' },
  { title: 'Built, launched, looked after', body: 'We build it with you, put it live, and stay for the fixes and the next version.' },
]
