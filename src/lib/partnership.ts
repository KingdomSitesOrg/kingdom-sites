/**
 * The commercial offer, in one place.
 *
 * Retainers to design, build, ship, and maintain custom products (mobile-led
 * proof) for product owners and business founders. Complexity tiers assigned
 * after a call. Optional AI package. SEO page exists separately.
 *
 * No long-term commitment. Prepay discounts for 6 months or 1 year.
 * Two months’ notice to end.
 */

import { INQUIRE_CTA, INQUIRE_PATH } from './contact'

/* ─── Pricing ───────────────────────────────────────────────────────────── */

/** Typical monthly averages — final band is assigned after a conversation. */
export type ComplexityTier = {
  id: 'focused' | 'full' | 'intensive'
  name: string
  /** Typical monthly average in USD (before prepay discount). */
  priceAround: number
  tagline: string
  bestFor: string
  promise: string
  example: string
  features: string[]
  featured?: boolean
}

export const TIERS: ComplexityTier[] = [
  {
    id: 'focused',
    name: 'Focused',
    priceAround: 1000,
    tagline: 'One clear product',
    bestFor: 'A single product surface with a steady feature flow and limited roles or integrations.',
    promise:
      'I design, build, ship, and maintain your product — next features, bug fixes, releases, and ongoing care.',
    example: 'Single-purpose mobile product with a clear workflow (e.g. a learning app).',
    features: [
      'Design, build, ship, and maintain — end to end',
      'Mobile-led custom product work',
      'Ongoing features and improvements',
      'You talk to the person who builds it',
    ],
  },
  {
    id: 'full',
    name: 'Full',
    priceAround: 2000,
    tagline: 'Real product depth',
    bestFor: 'Deeper product work: more roles, data, integrations, or a supporting surface alongside the app.',
    promise:
      'Same design–build–ship–maintain relationship at the capacity a growing product actually needs.',
    example: 'Business product with real ops behind the phone — multiple user types, serious backend.',
    featured: true,
    features: [
      'Everything in Focused',
      'Multi-role workflows and deeper data',
      'Integrations and supporting systems as needed',
      'Higher monthly build capacity',
    ],
  },
  {
    id: 'intensive',
    name: 'Intensive',
    priceAround: 3000,
    tagline: 'Business partner, not only a developer',
    bestFor:
      'Founders who want product depth plus someone who will think with them about the business — strategy, priorities, and how the product should grow.',
    promise:
      'I design, build, ship, and maintain the product — and help you strategize: what to build next, how it serves the business, and how to ship it.',
    example:
      'Multi-surface or high-velocity product where you need a partner who also thinks commercially (Ruta-shaped depth).',
    features: [
      'Everything in Full',
      'Business thinking and product strategy with you',
      'Priorities, roadmap, and “what actually moves the needle”',
      'Multi-surface / platform depth and high change velocity',
      'AI integration — included',
      'Websites & local SEO — included',
      'Graphic design for the product and brand*',
    ],
  },
]

/**
 * Intensive graphic design note — shown under pricing and FAQs.
 * Usually inside the ~$3k band; large or separate design campaigns may be extra.
 */
export const INTENSIVE_DESIGN_NOTE =
  '* Graphic design on Intensive is usually included in the ~$3,000/month band (UI, product visuals, brand pieces that support the product). Unusually large design campaigns or work for a different brand may be a separate fee — I will say so up front before anything is billed.'

/**
 * Single AI pricing note (tiers + API costs) — place outside the AI package card,
 * not inside the feature list.
 */
export const INTENSIVE_AI_NOTE =
  'AI tooling is included on Intensive (inside the ~$3,000/month band). On Focused and Full it is an optional add-on at $199/month. The package covers my work; you pay your own model and API costs either way.'


/** Scorecard used on the call (also summarized on the site). */
export const COMPLEXITY_FACTORS = [
  { title: 'Users and roles', desc: 'One role vs crew, office, customer, and more.' },
  { title: 'Data and workflows', desc: 'Simple log vs money, scheduling, offline field work.' },
  { title: 'Integrations', desc: 'None vs payments, maps, identity, third-party APIs.' },
  { title: 'Release pressure', desc: 'Occasional ships vs a continuous feature pipeline.' },
  { title: 'AI in product or ops', desc: 'None, light assist, or core to how the product works.' },
  { title: 'Surfaces', desc: 'A factor — single app can still be Full or Intensive.' },
]

export const ENTRY_PRICE_AROUND = TIERS[0].priceAround
export const ENTRY_PRICE_LABEL = `~$${ENTRY_PRICE_AROUND.toLocaleString()}`

/** Prepay discounts — no commitment required to start month-to-month. */
export const PREPAY_SIX_MONTHS_OFF = 0.1
export const PREPAY_YEAR_OFF = 0.2

export const PREPAY_OPTIONS = [
  {
    id: 'monthly' as const,
    label: 'Month to month',
    discount: 0,
    blurb: 'Start anytime. Two months’ notice to end.',
  },
  {
    id: 'six' as const,
    label: 'Pay 6 months ahead',
    discount: PREPAY_SIX_MONTHS_OFF,
    blurb: '10% off the typical monthly rate.',
  },
  {
    id: 'year' as const,
    label: 'Pay 1 year ahead',
    discount: PREPAY_YEAR_OFF,
    blurb: '20% off the typical monthly rate.',
  },
]

export function prepaidMonthlyEquivalent(priceAround: number, discount: number) {
  return Math.round(priceAround * (1 - discount))
}

export function sixMonthTotal(priceAround: number) {
  return prepaidMonthlyEquivalent(priceAround, PREPAY_SIX_MONTHS_OFF) * 6
}

export function yearTotal(priceAround: number) {
  return prepaidMonthlyEquivalent(priceAround, PREPAY_YEAR_OFF) * 12
}

/** Notice period once engaged. */
export const NOTICE_MONTHS = 2
export const NOTICE_LINE =
  'Two months’ notice to change tier or end the engagement. No long-term lock-in.'

export const PREPAY_LINE =
  'No commitment required. Pay six months ahead for 10% off, or a year ahead for 20% off.'

export const PRICING_ASTERISK =
  'Figures are typical averages. After a short call I place your product on Focused, Full, or Intensive from complexity — not a self-serve menu.'

/* ─── AI package ────────────────────────────────────────────────────────── */

export const AI_PACKAGE = {
  priceMonthly: 199,
  name: 'AI package',
  tagline: 'Optional add-on',
  promise:
    'AI tooling and implementation wired into real products and workflows — not demos.',
  freeConsult:
    'One free consultation (about one to two hours) on how to leverage AI: connectors, tools, skills, agent loops, and how they fit your work.',
  /** Short card footnote when the full INTENSIVE_AI_NOTE sits outside the card. */
  apiNote: 'You pay your own model and API costs. The package covers my work; usage fees stay with you.',
  features: [
    'AI in your product or internal tooling',
    'Grounded in your data where that is the job',
  ],
}

export const AI_PRICE_LABEL = `$${AI_PACKAGE.priceMonthly}`

/* ─── Positioning ───────────────────────────────────────────────────────── */

export const HERO = {
  /** Full hero headline — no separate accent split. */
  title: 'Custom products that advance your ideas and business',
  sub:
    'For product owners and business founders who have a long list of features and growth ahead — mobile-led software people actually use, with one person who designs, builds, ships, and maintains it with you, not a project that ends at launch.',
  ctaPrimary: INQUIRE_CTA,
  ctaPrimaryHref: INQUIRE_PATH,
  ctaSecondary: 'See pricing',
  ctaSecondaryHref: '/pricing',
  priceHint: `From ${ENTRY_PRICE_LABEL}/month · AI from ${AI_PRICE_LABEL}/month`,
}

export const OWNERSHIP_PILLARS = [
  {
    title: 'You keep shipping',
    desc: 'Lots of ideas, lots of features, real growth. I am the person who builds the next thing and fixes what breaks — every month, not only until launch day.',
  },
  {
    title: 'Design, build, ship, maintain',
    desc: 'Roadmap with you, design, build, release, and ongoing care. You are not managing freelancers or a ticket queue. You have a product partner.',
  },
  {
    title: 'Mobile-led, systems included',
    desc: 'The proof is apps people use on a phone. The work includes what makes them real — backend, web console, data, and AI when that is the job.',
  },
  {
    title: 'Built for operators and founders',
    desc: 'Internal tools, field apps, customer products that extend capability or save time. Not brochure sites. Not “anyone can make an app.” On Intensive, that includes business strategy and graphic design* — not only code.',
  },
]

export const STEPS = [
  {
    step: '1',
    title: 'A working conversation',
    desc: 'What you are building, who uses it, how hard the product is, and whether I am the right partner for it. Honest either way.',
  },
  {
    step: '2',
    title: 'Complexity band, not a guess',
    desc: 'I place you on Focused, Full, or Intensive from a simple scorecard — roles, data, integrations, velocity, AI, surfaces.',
  },
  {
    step: '3',
    title: 'Work starts',
    desc: 'Retainer from day one. The product is designed, built, shipped, and maintained inside that relationship — not a giant handoff after a one-off project.',
  },
  {
    step: '4',
    title: 'Stay or leave cleanly',
    desc: NOTICE_LINE + ' Prepay only if you want the discount.',
  },
]

export const FAQS = [
  {
    q: 'What am I actually buying?',
    a: 'A monthly retainer to design, build, ship, and maintain a defined product with you — next features, bugs, releases, and care. Not a pile of hours and not a site you never hear about again.',
  },
  {
    q: 'How do you pick Focused, Full, or Intensive?',
    a: 'After a call, from complexity: users and roles, workflows and data, integrations, how often you need to ship, whether AI is in the product, and how many surfaces are involved. A single app can still be Full or Intensive. Intensive is also for founders who want a business-thinking partner — strategy and priorities, not only implementation.',
  },
  {
    q: 'What is different about Intensive?',
    a:
      'Intensive is full product work plus business help: strategizing what to build and why, not only coding what you already decided. AI integration and websites & local SEO are included. Graphic design for the product and brand is usually included too — inside the ~$3,000/month average. Unusually large design work may be a separate fee; I will flag that before you pay.' +
      ' ' +
      '(See the design asterisk under pricing for the full note.)',
  },
  {
    q: 'Is AI tooling included or extra?',
    a: 'Included on Intensive. On Focused and Full it is an optional add-on at $199/month. The free consult (connectors, tools, skills, loops) is available either way. You pay your own model and API costs on every tier.',
  },
  {
    q: 'Is there a contract or commitment?',
    a: 'No long-term lock-in. Month to month is fine. If you pay six months ahead you get 10% off; a year ahead, 20% off. Two months’ notice to end or change tier.',
  },
  {
    q: 'Do you only build mobile apps?',
    a: 'Mobile is the lead proof. Custom products often need backend, web, and AI too — that work is part of the retainer when the product needs it.',
  },
  {
    q: 'What is the AI package?',
    a: `On Focused and Full, optional add-on at ${AI_PRICE_LABEL}/month for AI tooling and implementation. On Intensive it is already included in the retainer. Free consult covers connectors, tools, skills, and agent loops. You pay your own API and model usage costs.`,
  },
  {
    q: 'Who is this for?',
    a: 'Product owners and business founders with ongoing features and growth — people who want one engineer to design, build, ship, and maintain the product, not a project shop that disappears after launch.',
  },
  {
    q: 'Do you still do SEO or local websites?',
    a: 'Yes when it is useful — see the websites & SEO page. The main work is custom products designed, built, shipped, and maintained on a monthly retainer.',
  },
  {
    q: 'What have you shipped?',
    a: 'Ruta (service-management platform, web and mobile, with AI), Jam with Latin (mobile learning product on a retainer), Tap to Tick (personal iOS expense app), and AI tooling inside real products.',
  },
]

/** Homepage “who this is for” chips — even count for grids. */
export const AUDIENCE = [
  'Product owners',
  'Business founders',
  'Operators shipping internal tools',
  'Teams that need mobile-led software',
  'Founders with a long feature pipeline',
  'Anyone who wants a partner who ships and stays, not a handoff',
]

/** @deprecated Prefer TIERS / OWNERSHIP_PILLARS — kept only if old imports linger during migration. */
export const PILLARS = OWNERSHIP_PILLARS
export const FIRST_MONTH_FREE_SHORT = PREPAY_LINE
export const FIRST_MONTH_FREE_LONG = PREPAY_LINE + ' ' + NOTICE_LINE
export const UNLIMITED_NOTE =
  'The retainer covers continuous product work (design, build, ship, maintain). It is not unlimited free work for every business you own or a second full-time job without adjusting the tier.'
export const SOFTWARE_ANGLE = OWNERSHIP_PILLARS.slice(0, 3)
export const SEO_EXPLAINER: { title: string; desc: string }[] = []
export const AUDIENCE_TRADES = AUDIENCE
export const AUDIENCE_OTHER: string[] = []
export const ANNUAL_MONTHS_CHARGED = 12

/** @deprecated use prepaid helpers */
export function annualPrice(tier: { priceAround?: number; price?: number }) {
  const p = tier.priceAround ?? tier.price ?? ENTRY_PRICE_AROUND
  return yearTotal(p)
}
