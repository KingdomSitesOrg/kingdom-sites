/**
 * One page per project that had none on this site (T-389): Farzana Classroom,
 * KCUPG and the Delta Development Project, at /portfolio/<slug>.
 *
 * Facts only, each from the product itself or from this site: Farzana
 * Classroom's from its own pages (the scattered tools in its story) and the
 * demo school's screens; KCUPG's from kcupgs.com and its repository (six
 * regions, Census figures, no sign-in); Delta's from deltadevelopmentproject.com
 * (its eight activities, gallery and contact form). No invented numbers, no
 * client quotes. Every sentence here is listed in docs/wording-pass-2.md for
 * Thomas to read.
 */
import { PHOTOS, SHOTS, type Shot } from '@/lib/work'

export type Figure = {
  shot: Shot
  /** Drawn in the browser window: the product's name in the address bar. */
  product?: string
  note?: string
  title: string
  caption: string
}

/** A fact only Thomas can give (how long it took, what changed, who to quote).
    Until he answers, the page shows the question as a marked gap, and
    scripts/seo-check.mjs refuses the build, so none ships by accident. */
export type Pending = { pending: string }
export const isPending = (x: unknown): x is Pending => typeof x === 'object' && x !== null && 'pending' in x

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
  site: { href: string; label: string }
  hero: Figure
  problem: string[]
  built: { lead: string; list: string[] }
  took: string | Pending
  /** What improved after launch. */
  result: (string | Pending)[]
  quote: Quote | Pending
  figures: Figure[]
  /** Slugs from PROJECTS, shown as "More from my portfolio". */
  related: string[]
}

const FARZANA = 'Farzana Classroom'
const DEMO = 'Demo school'

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
    hero: { shot: SHOTS.farzanaHome, product: FARZANA, note: DEMO, title: 'Home', caption: '' },
    problem: [
      'A teacher’s week usually runs on a pile of separate tools: spreadsheets, PDFs sent by email, sign-up forms, video calls, a quiz app, a payments app and a calendar.',
      'Families end up asking where this week’s lesson is, and the teacher does the stitching by hand.',
    ],
    built: {
      lead: 'I built this from the ground up as a stable, quality, easy-to-navigate classroom app. Everything is stitched together, from payments to quiz results.',
      list: [
        'Each school gets its own site, with its own name and crest.',
        'A public list of classes, each with its price, and a free sample to try.',
        'Families sign up and pay online, at any hour.',
        'The teacher sees who is enrolled, who was active this week and who just joined.',
        'Ask Otus, the AI assistant on every school’s Home.',
        'It runs on the web, on phones and on desktop.',
      ],
    },
    took: { pending: 'How long Farzana Classroom has taken to build so far, in your words (the work began on 19 September 2026).' },
    result: [
      'Farzana Classroom is in beta, and the first school is coming soon. Classes, families and payments are in one place, not three tools stitched together.',
      { pending: 'What changed for the first school once it started using Farzana Classroom. It is in beta today, so this may wait until a school is live.' },
      'The screens on this page show Wren Hall, a made-up demo school, so no real family is shown.',
    ],
    quote: { pending: 'A quote from the first school or a beta teacher: their words, name and school, with their OK to share.' },
    figures: [
      {
        shot: SHOTS.farzanaClass,
        product: FARZANA,
        note: DEMO,
        title: 'A class page',
        caption: 'What a family sees: the class, its price, and a free sample to try before signing up.',
      },
      {
        shot: SHOTS.farzanaStudents,
        product: FARZANA,
        note: DEMO,
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
      'Churches in Kansas City want to meet the communities who have come to the city from North Africa, the Middle East and Asia.',
      'Where those communities live, which languages they speak and where people gather was spread across Census tables, maps and word of mouth.',
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
    took: { pending: 'How long the first version took, and the date it went live (the work began on 15 September 2026; the other five regions came in October).' },
    result: [
      'KCUPG is live at kcupgs.com, free to use, with no sign-in. It started as a map of the city’s South Asian communities and now covers six regions.',
      'Churches in Kansas City see which communities live where, and where to meet them.',
      { pending: 'What changed for the people using it: who uses KCUPG, and one thing it has helped them do.' },
    ],
    quote: { pending: 'Who to quote for KCUPG: their words, name, role and church or ministry, with their OK to share.' },
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
      'The Delta Development Project works with river-bank and urban communities in northern Bangladesh and Dhaka, so children start school, families can earn, and no one is left behind when floods, illness or poverty close in.',
      'Its supporters and partners are often far away, and the work needs one clear place where they can see it and get in touch.',
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
    took: { pending: 'How long the site took and the date it went live (the work is dated 31 August to 1 September 2026).' },
    result: [
      'The site is live at deltadevelopmentproject.com. Anyone can see the project’s work in one place, and write to the team from its Contact page.',
      { pending: 'What changed for the project after launch (for example messages through the contact form), only if they have told you.' },
    ],
    quote: { pending: 'Who to quote for the Delta Development Project: their words, name and role, with their OK to share.' },
    figures: [
      { shot: PHOTOS.deltaSchool, title: 'Primary school', caption: 'A village school, from the project’s own photos.' },
      { shot: PHOTOS.deltaRelief, title: 'Disaster response', caption: 'Relief supplies handed out, from the project’s own photos.' },
    ],
    related: ['kcupg', 'ministry', 'farzana'],
  },
} satisfies Record<string, CaseStudy>

export type CaseSlug = keyof typeof CASE_STUDIES
