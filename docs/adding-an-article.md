# Adding an article to the Journal or Guides

The site has two article sections (T-388, T-399), each with its own page and menu item, in this order:

- **Journal** at `/journal`: missions, faith, the persecuted church, the Bangladesh film, prayer, KCUPG and other project stories.
- **Guides** at `/guides`: software questions, made easy to understand.

Each article is one file in `src/content/articles/`, listed once in `src/content/articles/index.ts`. Each section's page (`/journal`, `/guides`) shows its newest article large, with its cover, and the older ones in a grid below, newest first. Every article page gets the author box, the "Summarize this article" button, its structured data, a share card and a place in the sitemap automatically.

## 1. Write the file

`src/content/articles/<slug>.ts`. The slug is the address, in lowercase words joined by hyphens: `/journal/<slug>` or `/guides/<slug>`.

```ts
import type { Article } from '@/lib/articles'

export default {
  section: 'journal', // or 'guides'
  slug: 'praying-for-bangladesh',
  title: 'Why we pray for Bangladesh every week', // the page's one heading
  seoTitle: 'Praying for Bangladesh', // optional: the search title, if it should differ from the heading
  description: 'One or two sentences for Google, share cards and the index card. 50 to 200 characters.',
  lede: 'The opening lines, shown large under the heading. For a guide: the answer, in two sentences.',
  published: '2026-11-12', // YYYY-MM-DD. Hidden everywhere until this date in Rochester, MN.
  updated: '2026-11-20', // optional
  keywords: ['pray for Bangladesh', 'unreached people groups'], // optional
  cover: { photo: '/Photos/mission-field.jpg', alt: 'What the photo shows', width: 1244, height: 700 }, // optional; without it a cover is drawn
  related: ['prayer', 'ministry'], // optional: Portfolio projects, by their slug in src/lib/work.ts
  sources: [{ label: 'Who says it', href: 'https://…' }], // optional: where any figure comes from
  body: `
## A sub-heading

A paragraph. Paragraphs are separated by a blank line. Links look like [the Prayer kit](/prayer) or [a source](https://example.com). Two asterisks on each side make words **bold**.

- A list item
- Another

1. A numbered step
2. The next step

> A quote, on lines starting with ">".
> — Who said it (optional: a last line starting with "— " turns the quote into a card)
`,
} satisfies Article
```

Inside `body`, write plain text. A backtick (`` ` ``) or `${` would need a backslash in front of it. Nothing else needs escaping: apostrophes and quotes are fine.

## 2. List it

Add two lines to `src/content/articles/index.ts`: the import at the top, and the name in the `ARTICLES` list. The order in the list only matters for articles with the same date: the one listed first shows first.

## 3. The cover

- **A photo:** only a real photo already in `public/` (never stock pictures). Give its path from `public/`, its width and height in pixels (`file public/Photos/x.jpg` shows them), and alt text that says what it shows.
- **No photo:** leave `cover` out. A simple abstract picture is drawn from the slug, in the site's colours: warm tones for the Journal, cooler ones for Guides. Each slug gets its own picture, and it stays the same from build to build. If you change the slug, the picture changes too.
- The cover is also the share card. A drawn cover is served as a PNG at `/covers/<section>/<slug>`.

## 4. Scheduled publishing

`published` is the day the article goes live, at midnight in Rochester, Minnesota (America/Chicago). Until then it is not on its index, in the sitemap, at its address (which returns 404), as a share card, or in the chat's "Summarize this article". The section pages, the article pages and the sitemap are checked again every hour, so the article appears within an hour of midnight on its date, with no deploy.

On its date (and on its `updated` date) a daily job tells Bing and the other IndexNow search engines about the article, its section's page and the sitemap, around 1 to 2 a.m. Rochester time. A production deploy's new and changed pages go out the same way, at the next daily run. Production only; see `src/lib/indexnow.ts`.

## 5. Check it

`npx vitest run src/lib/articles.test.ts` checks every article file:

- the section, slug and dates are valid;
- the description is the right length;
- the related projects exist;
- a photo cover is a real file;
- no two articles share an address.

Then build the site and run `node scripts/seo-check.mjs` to check the rendered page.

## Rules for the words

These are the rules every content task shares:

- Write in Thomas's voice, first person, plain and direct.
- Use no invented numbers, prices, clients or testimonials. Every public figure gets a source.
- Say "businesses, churches and anyone who needs software", never "small business".
- JAM Legio may be named; JAM with Latin may not.
- Ruta gets only what the Portfolio already says about it.
- Every new sentence goes into `docs/wording-pass-2.md` for Thomas's review.
