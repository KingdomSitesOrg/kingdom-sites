/**
 * The offer, in one place.
 *
 * Everything the site says about who we work with, what each plan delivers, and
 * what it costs is defined here — so changing a price or a deliverable is a
 * one-line edit rather than a hunt through the pages.
 *
 * The plans are deliberately specific. "Ask and it gets done" is fine at the top
 * of the range where the fee covers it, but at the entry price a vague promise
 * is one the business ends up losing money on — so Foundation and Growth commit
 * to counted deliverables instead.
 *
 * The numbers are set against what agencies actually charge in 2026: website
 * care plans land at $95–$195/month, Google Business Profile management at
 * $125–$475/month, and local SEO below roughly $499/month is widely accepted as
 * too thin to move rankings. Home service businesses are quoted $1,000–$3,500 a
 * month for what Growth and Everything cover.
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
    promise: 'A real website and a Google listing that is actually filled in, kept current every month.',
    features: [
      'Website built free — up to 5 pages, live in about two weeks',
      'Hosting, domain, security, backups and speed all handled',
      'Google Business Profile claimed and filled in properly: categories, services, service areas, hours, questions answered',
      '2 Google posts a month, plus your job photos put up',
      '2 changes a month — new price, new service, a photo, a typo',
      'A review link and QR card so customers can be asked on the spot',
      'A one-page report each month in plain English',
    ],
    limits: [
      'No ongoing search campaign — this keeps you present and current, it does not chase rankings',
      'No new pages each month',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 599,
    tagline: 'Get found',
    bestFor: 'A business that wants the phone to ring more than it does now.',
    promise: 'The month-after-month search work that actually moves you up — this is where results start.',
    featured: true,
    features: [
      'Everything in Foundation',
      'Up to 20 pages — a page for each service and each town you cover',
      '2 new pages or posts every month, written properly, not padded',
      'A Google post every week',
      '20 directory listings built and kept accurate',
      'Review requests sent automatically after a job, and replies written for you',
      'On-page search work every month against a tracked list of search terms',
      'Unlimited* text and photo changes, done within 2 working days',
      'A monthly report and a 20-minute call if you want one',
    ],
    limits: ['No paid advertising management — that is a separate conversation'],
  },
  {
    id: 'everything',
    name: 'Everything',
    price: 999,
    tagline: 'Own your market',
    bestFor: 'A business that wants to be the obvious first call in its area.',
    promise: 'Unlimited* work, every month, until you are the one everybody else is competing with.',
    features: [
      'Everything in Growth',
      'Unlimited* pages — every service in every town, as far as it is worth going',
      '4 to 6 new pages or posts every month',
      'Link building — local sponsorships, suppliers, associations, press',
      'Rank tracking and competitor watching, reported to you',
      'Landing pages built for seasonal offers and ad campaigns',
      'Reviews managed across every platform, not just Google',
      'Unlimited* changes, same or next working day',
      'My phone number — text me directly',
      'A strategy call every month',
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

/** What every plan covers, at the level an owner cares about. */
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
    title: 'Reviews, asked for properly',
    desc: 'A way to put the review link in a customer’s hand the day the job is done, while they are still happy. More reviews is more calls, every time.',
  },
  {
    title: 'Someone who answers when you call',
    desc: 'No ticket system, no account manager, no waiting a week for a price change. You text the person who built it, and it gets done.',
  },
]

/** Why pages and posts are worth paying for. Almost nobody buying this
    understands what a blog post has to do with the phone ringing, and a plan
    that sells "4 posts a month" without explaining it sounds like padding. */
export const SEO_EXPLAINER = [
  {
    title: 'Google can only show what you have given it',
    desc: 'A one-page website tells Google one thing about you. Twenty pages — one for each service, one for each town — give it twenty different ways to match what somebody typed. This is the whole reason the page count on each plan matters.',
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
    title: 'Google can tell the difference between an active business and an abandoned one',
    desc: 'A site that gains a page or two every month and a listing that gets posted to weekly reads as a real, trading business. A site untouched since 2021 reads as one that may have closed — and Google would rather not send a customer to a business that has closed.',
  },
  {
    title: 'The posts earn their keep off Google as well',
    desc: 'A written answer about soft washing is what you text the customer who asks. It is what a local Facebook group links to. Those links are themselves one of the strongest signals that you are the real thing in your area.',
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
    a: 'If you have nothing online, or something embarrassing, start at Foundation — it gets you existing properly for less than most people pay for website hosting alone. If you want the phone to ring more than it does today, that is Growth: below about $500 a month there is not enough hours in it to move you up the search results, and anyone telling you otherwise is selling you something. Everything is for when you want to take the whole area.',
  },
  {
    q: 'Why is Foundation so specific about the number of changes?',
    a: 'Because being vague at that price is how these arrangements quietly fall apart. Two changes a month at $299 is honest and I can keep doing it for years. Unlimited at $299 would mean either saying no to you constantly or resenting the work — neither of which is any use to you. Unlimited is real on Growth and Everything, where the fee covers it.',
  },
  {
    q: 'What does the asterisk on unlimited mean?',
    a: UNLIMITED_NOTE,
  },
  {
    q: 'I already have a website. It just does not do anything.',
    a: 'That is the usual situation. Most of the sites I take over were built once, years ago, and never touched again — no Google listing, no service pages, no reviews. I will tell you whether yours is worth rebuilding or worth improving, and either way it is the same monthly price.',
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
    a: 'Fair question, and most people selling them never answer it. Customers search in questions — "how much to pressure wash a driveway", "will soft washing hurt my siding". A post is you answering that question, and the business that answered it is the one they call. It also keeps working: a post written in March still brings calls in December, unlike an advert, which stops the day you stop paying for it.',
  },
  {
    q: 'Why monthly instead of paying once?',
    a: 'Because a website built once and abandoned stops working within a year, and that is what most small businesses have been sold. Getting found on Google is not a build, it is an ongoing job. Paying monthly means I am still working on it in month eighteen, and it means you are not handing over thousands of dollars up front.',
  },
  {
    q: 'How long before I see anything?',
    a: 'The site is usually live inside two weeks. The Google listing work shows up in a few weeks. Ranking for the searches that matter is a few months of steady work on Growth or Everything — anyone who promises you page one by next Tuesday is lying.',
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
