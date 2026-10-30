import type { Article } from '@/lib/articles'

export default {
  section: 'guides',
  slug: 'cost-to-keep-an-app-running',
  title: 'What does it cost to keep an app running after launch?',
  seoTitle: 'What it costs to keep an app running after launch',
  description: 'The real running costs of an app: Apple’s 99 USD a year, Google Play’s one-time 25 USD, the stores’ share of sales, hosting, and the yearly updates Apple and Google require.',
  lede: 'The fixed fees are small and public: Apple’s developer program is 99 USD a year, a Google Play account is a one-time 25 USD, and hosting and a database can start free and grow with use. The larger cost is keeping the app updated, because Apple and Google require apps to keep up with new phone systems, and an app nobody updates is eventually left behind.',
  published: '2026-10-30',
  keywords: ['cost to maintain an app', 'app maintenance cost', 'Apple developer fee', 'Google Play developer fee', 'app hosting cost'],
  related: ['tap-to-tick', 'latin-game', 'ruta'],
  sources: [
    { label: 'Apple: Enroll in the Apple Developer Program', href: 'https://developer.apple.com/programs/enroll/' },
    { label: 'Apple: Fee waivers', href: 'https://developer.apple.com/help/account/membership/fee-waivers' },
    { label: 'Apple: App Store Small Business Program', href: 'https://developer.apple.com/app-store/small-business-program/' },
    { label: 'Apple: Upcoming requirements', href: 'https://developer.apple.com/news/upcoming-requirements/' },
    { label: 'Google Play: Register for a developer account', href: 'https://support.google.com/googleplay/android-developer/answer/6112435?hl=en' },
    { label: 'Google Play: Service fees', href: 'https://support.google.com/googleplay/android-developer/answer/112622?hl=en' },
    { label: 'Google Play: Target API level requirements', href: 'https://support.google.com/googleplay/android-developer/answer/11926878?hl=en' },
    { label: 'Stripe: Pricing', href: 'https://stripe.com/pricing' },
    { label: 'Vercel: Pricing', href: 'https://vercel.com/pricing' },
    { label: 'Supabase: Pricing', href: 'https://supabase.com/pricing' },
  ],
  body: `
## The store fees

- Apple Developer Program: 99 USD per membership year ([Apple](https://developer.apple.com/programs/enroll/)). Nonprofits, accredited schools and government bodies that sell nothing through their apps can ask Apple for a fee waiver ([Apple](https://developer.apple.com/help/account/membership/fee-waivers)).
- Google Play: a one-time 25 USD registration fee ([Google](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)).

## The stores’ share of sales

If the app sells something digital inside it, such as a subscription, a course or a level, the store takes a share. Apple’s Small Business Program charges 15% for developers with up to 1 million USD a year in proceeds ([Apple](https://developer.apple.com/app-store/small-business-program/)). Google Play’s rates depend on the kind of purchase and where the customer is; for US subscriptions, its table lists 10% plus a 5% billing fee on the first 1 million USD a year ([Google](https://support.google.com/googleplay/android-developer/answer/112622?hl=en)).

Real-world goods and services, like a lawn visit or a class taught in person, are paid by card instead, through a payment company. Stripe’s standard US rate is 2.9% + 30¢ per successful card payment ([Stripe](https://stripe.com/pricing)).

## Hosting and the database

Most apps have a server and a database behind them: accounts, saved data, payments. For a small app this can start free. Two public examples: Vercel’s Hobby plan is free and its Pro plan is 20 USD a month per developer seat ([Vercel](https://vercel.com/pricing)); Supabase’s free plan pauses a project after a week without activity, and its Pro plan starts at 25 USD a month ([Supabase](https://supabase.com/pricing)). An app with real users should not sit on a plan that can pause. These costs grow with use: more people, more storage, more email.

## Updates you cannot skip

Apple and Google move the ground every year. Since April 28, 2026, every app uploaded to Apple must be built with Xcode 26 and the iOS 26 tools ([Apple](https://developer.apple.com/news/upcoming-requirements/)). On Google Play, from August 31, 2026, new apps and updates must target Android 16, and existing apps must target at least Android 15 to stay available to new users ([Google](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)).

An app that is not kept up to date slowly stops being offered to people on newer phones. And when something does break, a fix cannot ship until the app has been brought up to date first, which is the worst time to find out.

There are smaller running costs too:

- The domain name, renewed every year
- An email service for receipts and sign-in codes
- Error reporting, so you hear about a crash before a customer tells you
- Security updates to the building blocks the app is made from

## And someone’s time

The fees above are the easy part to plan for. The bigger part is time: applying the yearly updates, fixing what a new phone breaks, answering the stores’ review notes, and adding what users ask for. I build it and I maintain it, so looking after the app is part of the plan from the start, and its cost is part of the quote. See [How does a quote work?](/guides/how-a-quote-works)

## A simple way to budget

- Fixed: Apple 99 USD a year, Google 25 USD once, the domain name
- Grows with use: hosting, database, email, and the store’s or card company’s share of sales
- Time: the yearly updates, fixes and new features

If your plans do not need an app yet, a website avoids most of this list: see [Website or app: which does my business need?](/guides/website-or-app)
`,
} satisfies Article
