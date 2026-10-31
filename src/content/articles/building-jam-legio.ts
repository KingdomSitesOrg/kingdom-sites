import type { Article } from '@/lib/articles'

export default {
  section: 'journal',
  slug: 'building-jam-legio',
  title: 'Building JAM Legio: a Latin game made in partnership with JAM with Latin',
  seoTitle: 'Building JAM Legio, a Latin learning game for iPhone and Android',
  description: 'How JAM Legio, a Roman-legion Latin game for homeschool and classical students, was built with JAM with Latin: what the partnership brought, how the game teaches, and what I learned.',
  lede: 'JAM Legio is a Latin learning game for iPhone and Android that I built in partnership with JAM with Latin, whose own designers made its graphics. Students march a Roman legion north across Italy, one city at a time, and learn real classical Latin on the way.',
  published: '2026-12-04',
  keywords: ['JAM Legio', 'Latin learning game', 'Latin app for homeschool', 'classical Latin app', 'learn Latin iPhone Android'],
  related: ['latin-game'],
  sources: [
    { label: 'JAM Legio on the App Store', href: 'https://apps.apple.com/us/app/jam-legio/id6797884645' },
    { label: 'JAM Legio on Google Play', href: 'https://play.google.com/store/apps/details?id=com.jamwithlatin.app' },
    { label: 'JAM with Latin', href: 'https://jamwithlatin.com' },
  ],
  /* The app's own screens (T-403, Thomas). */
  phones: {
    shots: ['latinMap', 'latinCase', 'latinBoard'],
    share: { photo: '/latin-game/share-card.png', alt: 'JAM Legio: march from Rōma to Gallia and learn real Latin', width: 1200, height: 630 },
  },
  body: `
## What JAM Legio is

[JAM Legio](/latin-game) is a game for homeschool and classical students learning Latin. The App Store listing starts with one line that sums it up: "March from Rome to Gaul and learn real Latin along the way."

The march has thirteen stops, from Rōma north to Gallia, on a real map of Italy. Every city teaches one piece of the classical curriculum, and students clear its levels to march on. Twice on the road the legion makes camp, at Pīsae and Venetiae, to review the noun endings learned so far and drill the present-tense verbs. When they reach Gallia, the road turns back: the march home to Rōma reviews the whole journey.

It is on the [App Store](https://apps.apple.com/us/app/jam-legio/id6797884645) and [Google Play](https://play.google.com/store/apps/details?id=com.jamwithlatin.app). There is no email sign-up and there are no ads.

## How it started

Alexis Carrico, the leader and founder of [JAM with Latin](https://jamwithlatin.com), reached out because people wanted an app, but she didn't know what to do, how to build it, or what it should look and feel like. We collaborated to build a fun, interactive way to study Latin, and this is what learners are saying now:

> "You are a GENIUS. My 14 year old is doing so much Latin to "beat" me in the leader boards in your new game app! Thank you!! (It is also helping my Latin...)"
> — Susanna

## Teaching the grammar teachers teach

The thing I cared about most was that the game teaches real Latin, not a simplified version that a teacher would have to correct later.

- **Correct macrons throughout**, so students learn each word as it is actually written.
- **Real case forms.** In the case challenges, every choice is a correctly declined form of the noun, not a near-miss invented to trick you. You have to know which case is needed, not spot the typo.
- **The classical order:** declensions, then verbs, then sentences. That way it sits alongside Henle, Classical Conversations and other classical curricula rather than competing with them.
- **Sentences built only from words you have already learned.** From Vērōna on, students read short Latin sentences, and nothing in them is new.

## Making practice feel like a game

Daily practice is what makes a language stick, and daily practice is hard to keep up with a worksheet. So the game gives students reasons to come back:

- Coins for every level and city cleared, and an arena that shows who has earned the most on the road to Gallia.
- A word of the day on the home screen.
- A training mode for days when a full city is more than there is time for.

This is also why JAM Legio is an app and not a website: a game that is part of a daily habit belongs one tap away on the home screen. I wrote more about that choice in [Website or app?](/guides/website-or-app)

## How it is built

JAM Legio is built from one codebase for both iPhone and Android, so every new level and every fix reaches both at once. That matters for a program like this: families use whatever phone or tablet they have, and nobody should get a worse version because of the device in their house.

Both stores review every release, and both keep changing their requirements as phones change. Keeping an app current is ongoing work, not a one-time job, which is why I build and maintain what I make.

If you run a school, a program or a ministry and have an idea for an app like this, I would be glad to [hear about it](/get-started). You can see more of my work on the [Portfolio](/portfolio).
`,
} satisfies Article
