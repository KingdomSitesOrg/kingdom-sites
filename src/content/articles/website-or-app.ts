import type { Article } from '@/lib/articles'

export default {
  section: 'guides',
  slug: 'website-or-app',
  title: 'Website or app: which does my business need?',
  description: 'Most businesses need a website first; an app is worth it when customers come back often or need what only a phone does well. Real examples, what an app adds to the cost, and three questions to decide.',
  lede: 'Most businesses need a website first, because a website is what people find on Google and what they check before they call. An app is worth it when customers come back often to do the same thing, such as booking, ordering, tracking or learning, or when it needs something only a phone does well.',
  published: '2026-10-30',
  keywords: ['website or app for my business', 'do I need an app', 'website vs app', 'mobile app or website', 'app developer'],
  related: ['tap-to-tick', 'latin-game', 'ruta', 'delta'],
  sources: [
    { label: 'Apple: Enroll in the Apple Developer Program', href: 'https://developer.apple.com/programs/enroll/' },
    { label: 'Google Play: Register for a developer account', href: 'https://support.google.com/googleplay/android-developer/answer/6112435?hl=en' },
  ],
  body: `
## What a website does best

- Gets found in search and on Google Maps
- Works on every phone and computer, with nothing to download
- Says who you are, what you do and how to reach you
- Takes enquiries, bookings and payments
- Is quick and cheap to change

For many businesses, churches and organizations, a good website is all the software they need.

## What an app does best

- Sits on the home screen, one tap away
- Sends notifications
- Works without a signal
- Uses the camera, location and other phone features smoothly
- Makes a daily habit easy

## Examples from my own work

[Tap to Tick](/tap-to-tick), my iPhone expense app, is an app because you log a purchase in a tap or two, right when you make it, several times a day. [JAM Legio](/latin-game), a Latin learning game, is an app because daily practice should feel like a game, and new families find it on the App Store and Google Play. On [Ruta](/ruta), the crews use a phone app because they work out in the field, sometimes without a signal, while the office works on the web.

The [Delta Development Project](/portfolio/delta) is a website: people come to read about its work and support it, not to open it every day. [Farzana Classroom](/portfolio/farzana-classroom) is both: families find a class and sign up on the web, and the same school runs on phones and desktop.

## What an app adds to the cost

An app costs more to build and more to keep. Publishing it needs an Apple Developer Program membership, 99 USD a year ([Apple](https://developer.apple.com/programs/enroll/)), and a Google Play developer account, a one-time 25 USD fee ([Google](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)). Both stores review every release, and both require apps to keep up with new phone systems. [What does it cost to keep an app running after launch?](/guides/cost-to-keep-an-app-running) has the details.

As rough ranges, never a quote: a basic website is around $1,000 to $2,000, a basic app around $3,000 to $5,000, and more complex projects around $6,000 to $10,000 and up, depending on scope. The real figure comes once I understand the project: see [How does a quote work?](/guides/how-a-quote-works)

## Three questions to decide

1. Will your customers use it more than once a month? If not, a website.
2. Does it need notifications, use without a signal, or the camera? If so, an app may be right.
3. Do people still need to find you in the first place? Then start with the website, and add an app once there is something worth opening every week.

Many projects start as a website and add an app later on the same system behind it, so nothing built first is thrown away.

If you are still not sure, that is a normal place to start a conversation. Tell me what your customers do today, how often they come back, and what slows you down, and I will tell you plainly which one fits, even when the answer is the smaller, cheaper one.
`,
} satisfies Article
