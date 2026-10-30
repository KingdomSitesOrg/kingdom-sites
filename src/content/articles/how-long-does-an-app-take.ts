import type { Article } from '@/lib/articles'

export default {
  section: 'guides',
  slug: 'how-long-does-an-app-take',
  title: 'How long does it take to build an app?',
  seoTitle: 'How long does it take to build an app or website?',
  description: 'It depends on how much the first version has to do, and on a few waits outside anyone’s control. The stages, the store and account waits, and what makes a project slower or faster.',
  lede: 'How long an app takes depends mostly on how much the first version has to do: a focused first version takes weeks, a large system takes months. A few waits sit outside anyone’s control, such as company verification and the app stores’ reviews, so it pays to start those early.',
  published: '2026-11-25',
  keywords: ['how long does it take to build an app', 'app development timeline', 'how long to build a website', 'app store review time', 'Google Play closed testing'],
  related: ['latin-game', 'tap-to-tick'],
  sources: [
    { label: 'Apple: App Review', href: 'https://developer.apple.com/distribute/app-review/' },
    { label: 'Apple: D-U-N-S Number', href: 'https://developer.apple.com/help/account/membership/D-U-N-S/' },
    { label: 'Google Play: App testing requirements for new personal developer accounts', href: 'https://support.google.com/googleplay/android-developer/answer/14151465?hl=en' },
  ],
  body: `
I will not give you a single number here, because any number without knowing your project would be a guess. What I can do is show you where the time goes, so you can see why one project takes weeks and another takes months.

## Where the time goes

**1. Understanding the project.** We talk, I ask questions, and we agree on what the first version has to do. This is the cheapest stage to change your mind in, and the one that saves the most time later.

**2. Design.** What each screen shows and how people move between them. For a website this is quick. For an app with many screens it takes longer, and it is worth getting right before anything is built.

**3. Building.** The longest stage, and the one that depends most on scope. A booking screen is quick. Payments, accounts, notifications, use without a signal, and connections to other systems each add real time.

**4. Testing.** On real phones, by real people. Things that seem obvious to the person who built them are never obvious to the person using them for the first time.

**5. Launch.** For a website, this can be the same day. For an app, the stores have their own steps, below.

## The waits outside anyone's control

These are the parts that surprise people, because no amount of work makes them faster.

**Apple's review.** Every app and every update is reviewed by Apple before it appears on the App Store. Apple says it typically reviews at least 50% of submissions in under 24 hours and 90% in under 48 hours. Usually that is fine. If Apple asks for a change, the clock starts again once it is made.

**Company verification for Apple.** If the app is published under your company or organization's name (which I recommend, so it is yours), Apple needs a D-U-N-S Number registered to your organization. It is free, but Apple says to allow up to 5 business days to get one from Dun & Bradstreet, and up to 2 more business days for Apple to receive it.

**Google Play's closed test.** New personal developer accounts on Google Play must run a closed test with at least 12 testers, opted in continuously for at least 14 days, before the app can be published to everyone. Two weeks, at least, built into the calendar.

None of these is a problem if you know about them. Each of them is a problem if you find out the week you meant to launch. So I start the account setup at the beginning of a project, not the end.

## What makes a project faster

- **A clear, focused first version.** The biggest single factor. See [What is an MVP?](/guides/what-is-an-mvp)
- **Quick answers.** When a question comes up and the answer takes a week, the project waits a week.
- **One person who decides.** A committee adds time to every decision.
- **Content ready early.** Words, photos, prices and logos are often what holds up the last stretch.
- **Accounts set up early:** Apple, Google, the domain name and the payment provider.

## What makes a project slower

- Adding features once building has started. Sometimes it is the right call, and it always moves the date.
- Connections to older systems that are not well documented.
- Anything that handles money or private information. These take longer because they have to be right, and that time is never the place to save.

## Why one codebase helps

I build iPhone and Android apps from one codebase, so most of the work is done once for both. [JAM Legio](/latin-game), the Latin learning game I built, is on both the App Store and Google Play from the same code.

That does not make the two store processes the same: each still has its own review, accounts and rules. But it does mean you are not paying for, or waiting on, two separate apps.

## Getting a real answer

The honest answer to "how long?" comes after the first conversation, once I understand what the first version needs to do. You get it with the quote, as a plan with the stages laid out, not a number pulled from the air. [How a quote works](/guides/how-a-quote-works) says what happens next.
`,
} satisfies Article
