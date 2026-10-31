import type { Article } from '@/lib/articles'

export default {
  section: 'guides',
  slug: 'own-your-code-and-accounts',
  title: 'Do you own your website or app? What to make sure is in your name',
  seoTitle: 'Own your website or app: the accounts to keep in your name',
  description: 'The code, the domain name, the app store accounts and the payment account should all belong to you, not to whoever built it. A checklist, and why it matters the day you need it.',
  lede: 'Yes, you should own your website or app, and that means more than the code: the domain name, the hosting, the App Store and Google Play accounts and the payment account should all be in your name. If the person who built it disappears, you should be able to hand everything to someone else the next day.',
  published: '2026-12-01',
  keywords: ['own my website', 'who owns my app', 'app store account in my name', 'domain name ownership', 'website developer ownership'],
  related: ['latin-game', 'farzana'],
  sources: [
    { label: 'Apple: D-U-N-S Number', href: 'https://developer.apple.com/help/account/membership/D-U-N-S/' },
    { label: 'Apple: Enroll in the Apple Developer Program', href: 'https://developer.apple.com/programs/enroll/' },
    { label: 'Google Play: Register for a developer account', href: 'https://support.google.com/googleplay/android-developer/answer/6112435?hl=en' },
  ],
  body: `
## Why this matters

Most of the time, nobody thinks about who owns what. The site works, the app works, and the person who built it is a phone call away.

Then something changes. They move on, get busy, raise their prices, or simply stop answering. And it turns out the domain name was registered in their name, the app sits in their App Store account, and the code lives on their computer. Getting it back can take months, cost real money, or not be possible at all.

I would rather you never find yourself there, with me or with anyone.

## The checklist

Here is what should be in your name, or your organization's name, with you holding the login:

**1. The domain name.** Your web address (yourbusiness.com) should be registered to you, at a registrar where you have the login. This is the single most important item: it is how every customer finds you, and it is the hardest thing to replace.

**2. The App Store account.** For an iPhone app, the Apple Developer Program membership should be yours. For a company or organization, Apple requires a D-U-N-S Number registered to your legal entity. It is free, and it takes some days to arrive, so start early. Apple's membership is 99 USD a year.

**3. The Google Play account.** The same for Android: a Google Play developer account in your name, with a one-time 25 USD registration fee.

**4. The code.** The code should sit in a place you have access to, usually a private code repository in your own account, with the right to use and change it written into your agreement.

**5. The hosting and database.** Where the site or app runs. These can be in your own accounts, with the developer added as a team member.

**6. The payment account.** If you take payments, the payment account (such as Stripe) must be yours. The money goes to you, never through someone else's account.

**7. Email and important logins.** Your email for the domain, and any service the business depends on.

## Ownership versus access

None of this means you have to manage these systems yourself. You can, and usually should, give your developer access to do the work. The difference is who sits at the top.

The right setup is: **you own it, and you give the developer access.** The wrong setup is: the developer owns it, and gives you access. On a good day they look the same. On a bad day they are completely different.

When you invite someone into your accounts as a team member, you can remove them later. When they own the account, you cannot remove them from it.

## How I set it up

When I build an app or website, my aim is that it ends up in your name: your domain, your store accounts, your payment account. I can help you create each account, and I work inside them as a team member. If you ever want to move on, you keep everything and nothing needs to be rescued.

The one thing I ask is that you start the store accounts early, because some steps (such as Apple's company verification) take days and cannot be hurried. [How long does it take to build an app?](/guides/how-long-does-an-app-take) explains those waits.

## Questions to ask any developer

Whether you work with me or anyone else, ask these before you start:

1. Whose name will the domain, the store accounts and the payment account be in?
2. Will I have the logins from day one?
3. Where will the code be kept, and will I have access to it?
4. If we stop working together, what do I get, and how?

A good developer will answer all four without hesitating. If the answers are vague, ask again before you sign anything.

## What it costs to keep it yours

Owning these accounts comes with some yearly fees: the domain, the Apple membership and the hosting. [What does it cost to keep an app running?](/guides/cost-to-keep-an-app-running) lists them with sources. They are small next to the cost of losing control of your own business's software.
`,
} satisfies Article
