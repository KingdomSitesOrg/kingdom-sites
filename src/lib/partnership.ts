/**
 * The offer, in one place.
 *
 * Everything the site says about who we work with, what they get each month, and
 * what it costs is defined here — so changing the price or adding a trade is a
 * one-line edit rather than a hunt through the pages.
 */

/** What one month of the partnership costs. No setup fee, no contract. */
export const MONTHLY_PRICE = 199

/** Shown as "$199/month" wherever the price appears. */
export const MONTHLY_PRICE_LABEL = `$${MONTHLY_PRICE}`

/** The trades this is built for. Order matters — the first few are the ones we
    already work with, and they lead everywhere the list is shown. */
export const TRADES = [
  'Pressure washing',
  'Window cleaning',
  'Landscaping & lawn care',
  'Gutter cleaning',
  'Handyman & repairs',
  'Roof cleaning',
  'Deck & fence',
  'Junk removal',
  'Painting',
  'Concrete & driveways',
  'Pool service',
  'Moving & hauling',
]

/** What is included every month, for the one price. */
export const INCLUDED = [
  {
    title: 'A website built for one job: the phone ringing',
    desc: 'Your services, your area, your prices if you want them shown, and a big obvious way to call or ask for a quote on every screen. Loads fast on a phone, because that is where nearly every customer will find you.',
  },
  {
    title: 'Your Google listing sorted out',
    desc: 'Google Business Profile claimed, filled in properly, categories and service areas right, hours correct, photos posted. This is the single biggest thing most local businesses are leaving on the table.',
  },
  {
    title: 'Getting found for what people actually search',
    desc: 'The words people type when they need you — the service plus the town — worked into real pages, one per service and one per area you cover. This is the part that compounds month after month.',
  },
  {
    title: 'Your real work, shown properly',
    desc: 'Send job photos from your phone and they go up as before-and-afters. Nothing sells a driveway wash like the driveway.',
  },
  {
    title: 'Reviews, asked for automatically',
    desc: 'A simple way to put the review link in a customer’s hand the day the job is done, while they are still happy. More reviews is more calls, every time.',
  },
  {
    title: 'Changes whenever you need them',
    desc: 'New service, new price, new town, seasonal offer, a typo you spotted — text me and it is done. No change requests, no hourly rate, no waiting a week.',
  },
  {
    title: 'A plain-English report each month',
    desc: 'How many people found you, what they searched, how many called. No dashboard to learn — a short note you can read on a job site.',
  },
  {
    title: 'Hosting, domain, security, backups',
    desc: 'The technical upkeep nobody should have to think about. It is handled, and it is in the price.',
  },
]

/** How an engagement runs, start to finish. */
export const STEPS = [
  {
    step: '1',
    title: 'A conversation, not a sales call',
    desc: 'Tell me what you do, where you work, and where the jobs come from now. Twenty minutes on the phone. I will tell you honestly whether I think I can help.',
  },
  {
    step: '2',
    title: 'I build it — free',
    desc: 'The whole site, your Google listing, the lot. You pay nothing while it is being built, and nothing at all until you have seen it and you like it.',
  },
  {
    step: '3',
    title: 'It goes live and I keep working',
    desc: 'The monthly fee starts the day it is live. From then on I am the person who runs your online presence — improving it, adding to it, answering the phone when you call.',
  },
  {
    step: '4',
    title: 'Leave any time',
    desc: 'No contract and no exit fee. If the work is not bringing you business, you should not be paying for it. The domain name is yours either way.',
  },
]

/** The objections these owners actually have, answered straight. */
export const FAQS = [
  {
    q: 'I already have a website. It just does not do anything.',
    a: 'That is the usual situation. Most of the sites I take over were built once, years ago, and never touched again — no Google listing, no service pages, no reviews. I will tell you whether yours is worth rebuilding or worth improving, and either way it is the same monthly price.',
  },
  {
    q: 'I am not a computer person.',
    a: 'You do not need to be. There is nothing for you to log into, nothing to update, and no software to learn. You text me photos and tell me what changed. That is the whole job on your end.',
  },
  {
    q: 'Why monthly instead of paying once?',
    a: 'Because a website built once and abandoned stops working within a year, and that is what most small businesses have been sold. Getting found on Google is not a build, it is an ongoing job. Paying monthly means I am still working on it in month eighteen, and it means you are not handing over thousands of dollars up front.',
  },
  {
    q: 'How long before I see anything?',
    a: 'The site is usually live inside two weeks. The Google listing work starts showing up in a few weeks. Ranking for the searches that matter is a few months of steady work — anyone who promises you page one by next Tuesday is selling you something.',
  },
  {
    q: 'What if I want to stop?',
    a: 'You stop. Cancel any time, and the domain name transfers to you. I would rather you leave easily than feel stuck.',
  },
  {
    q: 'Do you work with businesses outside the home services trades?',
    a: 'Yes. The trades are where I am most useful because the playbook is well worn, but the same partnership works for any local business that lives on being found and called.',
  },
]
