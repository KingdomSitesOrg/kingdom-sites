import type { Article } from '@/lib/articles'

export default {
  section: 'guides',
  slug: 'what-is-an-mvp',
  title: 'What is an MVP, and why should you start small?',
  seoTitle: 'What is an MVP? Why to start small with a website or app',
  description: 'An MVP is the smallest version of your website or app that real people can use for the job it is meant to do. What goes in it, what waits, and why starting small costs less.',
  lede: 'An MVP, a minimum viable product, is the smallest version of your website or app that real people can use for the job it is meant to do. You start there because the first weeks of real use teach you more than months of planning, and they cost far less.',
  published: '2026-11-07',
  keywords: ['what is an MVP', 'minimum viable product', 'start small app', 'first version of an app', 'MVP website'],
  related: ['farzana', 'tap-to-tick'],
  body: `
## What "minimum" and "viable" mean

Both words matter, and people usually forget one of them.

**Minimum** means you leave out everything that is not needed for the main job. No settings screen nobody asked for, no second language before you have one customer who reads it, no dashboard of charts before there is any data to put in them.

**Viable** means what is left actually works. It is not a mock-up or a slide deck. A real person can sign up, book, pay, log, learn, or whatever the main job is, without you standing beside them to explain it.

An MVP that is minimum but not viable is a demo. An MVP that is viable but not minimum is just a big project with a smaller name.

## Why start small

- **You find out what people really do.** Everyone has a picture of how customers will use the thing. Real use always surprises you somewhere, and it is much cheaper to be surprised early.
- **You spend less before you know.** Every feature costs money to build and money to keep. Building the ones people turn out not to use is the most expensive mistake in software, and the most common one.
- **You get something in people's hands sooner.** A small version can be in use in weeks. A complete version can take many months, and the world moves on while it is being built.
- **Nothing is wasted.** A well-built MVP is the foundation, not a throwaway. The next features are added to the same system.

## What goes in, and what waits

Here is how I decide with a client. Write down the one job the product has to do. Then go through every feature on the wish list and ask one question: can someone do the main job without this?

If they can, it waits. It goes on a list for later, and nothing is lost by writing it down.

For an app that books appointments, the MVP might be:

- See the open times
- Book one
- Get a confirmation
- The owner sees the booking and can cancel it

And these wait: reminders by text, repeat bookings, reviews, a loyalty scheme, staff accounts with different permissions. Each of these might be a good idea. None of them is needed to book an appointment.

## What it looks like in my own work

[Tap to Tick](/tap-to-tick), my own iPhone expense app, is built around one job: log a purchase in a tap or two, right when you make it. If that one job is slow, nothing else in the app matters, so that is where the effort goes first.

[Farzana Classroom](/portfolio/farzana-classroom) is a much bigger system: classes, families, payments and quiz results in one place. Even there, every new school gets the parts it needs for its first classes first, and the rest is added on top once people are using it.

## When starting small is the wrong advice

Sometimes the minimum is larger than people hope. If you take payments, the payments have to be right on day one. If the app holds children's information or anything private, the privacy and security have to be right on day one. Those are part of "viable", and they are never the place to cut.

Starting small also does not mean starting sloppy. The first version should be built properly, so the second version can be built on it rather than starting again.

## The short version

1. Name the one job.
2. Build only what that job needs, and build it well.
3. Put it in front of real people.
4. Watch what they do, then decide what comes next.

If you have a list of features and are not sure which ones make the first version, that is a good conversation to have before anything is built. It is also the part of a project where I can save you the most money. [How a quote works](/guides/how-a-quote-works) says what happens next.
`,
} satisfies Article
