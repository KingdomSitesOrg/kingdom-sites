/**
 * The offer, in one place.
 *
 * Plans stay simple on purpose: pages, blog posts, and hours of SEO each month.
 * Foundation = exist properly. Growth ≈ 50–60% more of the same work.
 * Everything = partner-level: weekly posts, unlimited changes, real SEO time.
 */

/** Two months free when a year is paid up front — the price of ten months. */
export const ANNUAL_MONTHS_CHARGED = 10

/** The first month costs nothing — it is the month everything gets built and
    put live. Said the same way everywhere it appears. */
export const FIRST_MONTH_FREE_SHORT = 'First month free'
export const FIRST_MONTH_FREE_LONG =
  'Your first month is free. That is the month I build the site, set up your Google listing and put the whole thing live — so you have seen it, used it and shown it to your wife before a single dollar leaves your account.'

/** The one line that keeps "unlimited" honest. */
export const UNLIMITED_NOTE =
  'Unlimited means what it says — ask and it gets done. It stops being reasonable when it turns into a second full-time job: a complete rebrand, a brand new site every month, or work for a different business you own. If we ever get near that line I will say so plainly, before doing anything about it.'

export type Tier = {
  id: string
  name: string
  price: number
  tagline: string
  bestFor: string
  /** Shown as the headline promise for the plan. */
  promise: string
  features: string[]
  /** What this plan honestly does not do. Empty on the top plan. */
  limits: string[]
  featured?: boolean
}

export const TIERS: Tier[] = [
  {
    id: 'foundation',
    name: 'Foundation',
    price: 299,
    tagline: 'Exist properly',
    bestFor: 'A business with no website, or one that has gone stale.',
    promise: 'A clean site, a proper Google listing, and steady monthly work so you stay present.',
    features: [
      'Website built free — up to 4 pages, live in about two weeks',
      'Hosting, domain, security and backups handled',
      'Google listing set up the right way',
      'Initial search setup so you show up correctly',
      '1 blog post a month',
      '1 hour a month of SEO',
      'Small updates when you need them (prices, photos, typos)',
    ],
    limits: [
      'Steady presence — not a full ranking push every month',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 599,
    tagline: 'Get found',
    bestFor: 'A business that wants the phone to ring more than it does now.',
    promise: 'More pages, more posts, more SEO time — this is where search results start to move.',
    featured: true,
    features: [
      'Everything in Foundation',
      'Up to 7 pages — room for your main services and towns',
      '2 blog posts a month',
      'About 2 hours a month of SEO',
      'Google listing kept active (posts and job photos)',
      'More updates each month when something changes',
      'A short monthly note on what we did and what is next',
    ],
    limits: ['Paid ads are separate if you want them later'],
  },
  {
    id: 'everything',
    name: 'Everything',
    price: 999,
    tagline: 'Business partner',
    bestFor: 'A business that wants a real partner on growth — not a set-and-forget site.',
    promise: 'Unlimited* changes, weekly content, and serious monthly SEO time until you are the obvious call.',
    features: [
      'Everything in Growth — treated as a partnership, not a ticket queue',
      'Unlimited* pages as your market needs them',
      '1 to 2 blog posts a week',
      '2 to 3 hours a month on search and optimization',
      'Unlimited* changes — text me, it gets done',
      'Strategy check-in every month',
      'My number — you talk to me, not a helpdesk',
    ],
    limits: [],
  },
]

/** Twelve months for the price of ten. */
export function annualPrice(tier: Tier) {
  return tier.price * ANNUAL_MONTHS_CHARGED
}

/** The cheapest way in — used wherever the site says "from $X". */
export const ENTRY_PRICE_LABEL = `$${TIERS[0].price}`

/** What every plan covers, at the level an owner cares about.
 *  Keep this list even (2 / 4 / 6) so card grids never leave an orphan tile.
 *  See /squareup and EvenGrid. */
export const PILLARS = [
  {
    title: 'A website built for one job: the phone ringing',
    desc: 'Your services, your area, your prices if you want them shown, and an obvious way to call or ask for a quote on every screen. Fast on a phone, because that is where nearly every customer will find you.',
  },
  {
    title: 'Your Google listing sorted out',
    desc: 'Claimed, filled in properly, categories and service areas right, hours correct, photos posted, questions answered. For most local businesses this is the single biggest thing being left on the table.',
  },
  {
    title: 'Getting found for what people actually search',
    desc: 'The words people type when they need you — the service plus the town — worked into real pages, one per service and one per area. This is the part that compounds month after month.',
  },
  {
    title: 'Reviews, and a person who answers',
    desc: 'A way to ask for a review while the customer is still happy — plus no ticket system when you need a change. You text the person who built it, and it gets done.',
  },
]

/** Why pages and posts are worth paying for. Almost nobody buying this
    understands what a blog post has to do with the phone ringing, and a plan
    that sells "4 posts a month" without explaining it sounds like padding. */
/** Four points — even grid on home (2×2) and a clean stack on local-business. */
export const SEO_EXPLAINER = [
  {
    title: 'Google can only show what you have given it',
    desc: 'A thin site tells Google almost nothing. Real pages for what you do and where you work give it something to match when someone types a search. That is why page count on each plan matters.',
  },
  {
    title: 'People search in questions, not keywords',
    desc: 'Nobody types "pressure washing". They type "how much to pressure wash a driveway" or "will soft washing damage vinyl siding". A blog post is simply you answering that exact question — and the business that answered it is the one whose number they end up calling.',
  },
  {
    title: 'A post you wrote in March is still working in December',
    desc: 'This is the part that separates it from advertising. Ads stop the day you stop paying. A page that ranks keeps bringing calls for years, which is why the work compounds and why month eighteen is worth more than month two.',
  },
  {
    title: 'Active businesses rank; abandoned ones do not',
    desc: 'A site that gets a fresh post and real SEO time each month reads as open for business. Those posts also get shared in local groups and texted to customers — signals that you are the real thing in your area.',
  },
]

/** The half of the business that is not marketing. This is the differentiator
    against every agency the owner has been cold-called by. */
export const SOFTWARE_ANGLE = [
  {
    title: 'Your site is built, not assembled',
    desc: 'Most small business sites are page-builder templates that take eight seconds to load on a phone. I write them properly, so they load instantly — which matters both to Google and to the customer deciding whether to wait.',
  },
  {
    title: 'Software you cannot buy off a shelf',
    desc: 'Online booking that matches how you actually schedule. A quote calculator that turns square footage into a price while the customer is still on the page. Automatic follow-ups to last year’s customers when the season turns. Quoted separately when you want it — but you already have the person who can build it.',
  },
  {
    title: 'I have built the software your industry runs on',
    desc: 'Ruta is a platform that carries a landscaping company from the first quote to the final payment — scheduling, crews in the field, billing. I helped build it. That is why I understand your business rather than just your website.',
  },
]

/** Who this is for. The trades lead because that is where I am most useful,
    but the same work fits any business that lives on being found locally. */
export const AUDIENCE_TRADES = [
  'Pressure washing',
  'Window cleaning',
  'Landscaping & lawn care',
  'Gutter cleaning',
  'Handyman & repairs',
  'Roofing',
  'Painting',
  'Junk removal',
  'Pool service',
  'Concrete & driveways',
  'HVAC & plumbing',
  'Moving & hauling',
]

export const AUDIENCE_OTHER = [
  'Restaurants & cafés',
  'Salons & barbers',
  'Gyms & studios',
  'Dentists & clinics',
  'Auto repair',
  'Photographers',
  'Accountants & lawyers',
  'Shops & retail',
  'Churches & ministries',
  'Anything else local',
]

/** How an engagement runs, start to finish. */
export const STEPS = [
  {
    step: '1',
    title: 'A conversation, not a sales call',
    desc: 'Tell me what you do, where you work, and where the jobs come from now. Twenty minutes on the phone. I will tell you honestly whether I think I can help, and which plan actually fits.',
  },
  {
    step: '2',
    title: 'Your first month is free',
    desc: 'That first month is when I build the site, claim and fill in your Google listing, and put it all live. It costs you nothing. If you do not like what you see, you walk away owing me nothing at all.',
  },
  {
    step: '3',
    title: 'Month two, the plan starts',
    desc: 'From then on I am the person who runs your online presence — adding pages, posting, chasing reviews, improving what is there, and answering the phone when you call.',
  },
  {
    step: '4',
    title: 'Move or leave any time',
    desc: 'Change plan whenever you like, up or down. No contract and no exit fee, and the domain name is yours either way.',
  },
]

/** The objections these owners actually have, answered straight. */
export const FAQS = [
  {
    q: 'Which plan do I actually need?',
    a: 'Foundation is for existing properly: a real site, a proper listing, one post and one hour of SEO a month. Growth is more of the same work — more pages, two posts, about two hours of SEO — for owners who want the phone to ring more. Everything is the partner plan: weekly posts, 2–3 hours of SEO, unlimited changes, and a monthly strategy check-in.',
  },
  {
    q: 'What does "hours of SEO" actually mean?',
    a: 'Time spent improving how you show up when people search: the right words on pages, fixing what Google already sees, checking what is working, and nudging the things that are not. Foundation is one focused hour. Growth is about two. Everything is two to three — enough to compound month after month.',
  },
  {
    q: 'What does the asterisk on unlimited mean?',
    a: UNLIMITED_NOTE,
  },
  {
    q: 'I already have a website. It just does not do anything.',
    a: 'That is the usual situation. Most of the sites I take over were built once, years ago, and never touched again. I will tell you whether yours is worth rebuilding or worth improving, and either way it is the same monthly price.',
  },
  {
    q: 'I am not a computer person.',
    a: 'You do not need to be. There is nothing for you to log into, nothing to update, and no software to learn. You text me photos and tell me what changed. That is the whole job on your end.',
  },
  {
    q: 'What does "first month free" actually mean?',
    a: FIRST_MONTH_FREE_LONG + ' There is no card taken up front and nothing to cancel if you change your mind — billing simply starts in month two, once the thing exists and you have seen it.',
  },
  {
    q: 'What is a blog post going to do for a pressure washing business?',
    a: 'Fair question. Customers search in questions — "how much to pressure wash a driveway", "will soft washing hurt my siding". A post is you answering that question, and the business that answered it is the one they call. It also keeps working: a post written in March still brings calls in December, unlike an advert.',
  },
  {
    q: 'Why monthly instead of paying once?',
    a: 'Because a website built once and abandoned stops working within a year. Getting found on Google is ongoing work — posts, SEO hours, listing updates. Paying monthly means I am still on it in month eighteen, and you are not handing over thousands up front.',
  },
  {
    q: 'How long before I see anything?',
    a: 'The site is usually live inside two weeks. Listing work shows up in a few weeks. Real movement in search takes a few months of steady posts and SEO time on Growth or Everything — anyone who promises page one by next Tuesday is lying.',
  },
  {
    q: 'What if I want to stop?',
    a: 'You stop. Cancel any time from your billing page, and the domain name transfers to you. I would rather you leave easily than feel stuck.',
  },
  {
    q: 'Is this only for the trades?',
    a: 'No — I work with any business. The trades lead the list because the playbook there is well worn and I know the work from the inside, but a salon, a restaurant, a dental practice or an accountant is found the same way and served by the same plans.',
  },
]
