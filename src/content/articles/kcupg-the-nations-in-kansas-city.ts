import type { Article } from '@/lib/articles'

export default {
  section: 'from-the-field',
  slug: 'kcupg-the-nations-in-kansas-city',
  title: 'The nations are in Kansas City: what the KCUPG maps show',
  seoTitle: 'KCUPG: the 10/40 Window communities of Kansas City, mapped',
  description: 'More than 78,000 people from the 10/40 Window live across the Kansas City metro. What the KCUPG maps show, why I built them, and how churches can use them.',
  lede: 'More than 78,000 people from the 10/40 Window, the part of the world where most unreached people groups live, make their homes across the Kansas City metro. KCUPG puts those communities on a map, so churches can see who their neighbors are and where to meet them.',
  published: '2026-11-28',
  keywords: ['KCUPG', 'Kansas City unreached people groups', 'diaspora missions Kansas City', '10/40 Window', 'Kansas City immigrant communities'],
  cover: { photo: '/work/kcupg-dashboard.jpg', alt: 'The KCUPG dashboard: Kansas City’s communities at a glance, with people, mapped places and census areas, and each region by size', width: 1800, height: 1125 },
  related: ['kcupg', 'prayer'],
  sources: [
    { label: 'KCUPG: all regions (figures checked October 30, 2026)', href: 'https://kcupgs.com' },
  ],
  body: `
## What KCUPG is

[KCUPG](https://kcupgs.com) is a set of maps and dashboards of the communities in the Kansas City metro whose families come from the 10/40 Window. The 10/40 Window is the band of the world from roughly 10° to 40° north of the equator, across North Africa, the Middle East and Asia. It is where most of the world's unreached people groups live, and where the Christian presence is thinnest.

I built the dashboard and the maps. The people in it are not a statistic from far away. They are neighbors, coworkers and classmates in one American city.

## What the maps show

As of October 30, 2026, the site counts **78,373** people from the 10/40 Window across the metro, by Census ancestry, in six regions:

- **Southeast Asia: 25,164** (Vietnam, the Philippines, Myanmar, Laos and others)
- **South Asia: 22,539** (India, Pakistan, Bangladesh, Nepal, Bhutan, Sri Lanka)
- **East Asia: 15,483** (China, Taiwan, Korea, Japan and others)
- **Middle East: 12,361** (Lebanon, Iran, Iraq, Syria, Turkey and others)
- **North Africa: 2,204** (Egypt, Sudan, Morocco and others)
- **Central Asia: 622** (Afghanistan, Uzbekistan and others)

It also maps **352** places and **460** census areas, so you can see not just how many people there are, but where they live.

One honest caution about what these numbers are. They count people by where their families come from. They do not say anything about any one person's faith. Some people from these regions already follow Jesus, and the maps are not a list of people to be "reached". They are a picture of who lives where, so that churches can love their neighbors on purpose.

## Why this matters

For most of church history, reaching the peoples of the 10/40 Window meant crossing an ocean. It still often does, and we need people who will go. But many families from those same countries now live a short drive from churches in Kansas City.

That is an opportunity most of us never think about. Some people from these regions come from countries where meeting a Christian is rare, and where talking openly about Jesus can be dangerous. Here, they can be welcomed, helped, befriended, and told the good news freely.

The question from Romans 10:14 is the same one I keep coming back to: how will they hear without someone telling them? For some of them, the someone could be a church a few streets away.

## How a church can use it

- **Know who is near you.** Open the map for a region and look at your own part of the city. You may find a community you did not know was there.
- **Pray for them by name.** Pick one community and pray for it for a month: for its families, its students, and the believers already in it.
- **Meet real needs.** English classes, help with paperwork, rides, a meal for a new family. Love that is practical opens doors that arguments never do.
- **Learn before you go.** Find out what the community celebrates, what it needs, and who already serves it. Partner with them rather than starting from scratch.

## Why I built it as software

I build websites and apps for a living, and this was a chance to put those skills straight into gospel work. Each region has its own dashboard and map, and you can open a region's map already filtered to one community. If you find something on the site that is wrong or out of date, the site says where to send a correction, and it comes to me.

It is also an example of something I care about: software does not have to be only for business. The same tools that help a company find customers can help a church find its neighbors.

If you lead a church or ministry in Kansas City and want to use the maps, [take a look](https://kcupgs.com). If you would like something like it for your own city, [talk to me](/get-started).
`,
} satisfies Article
