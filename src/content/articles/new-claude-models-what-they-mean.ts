import type { Article } from '@/lib/articles'

export default {
  section: 'guides',
  slug: 'new-claude-models-what-they-mean',
  title: 'A new AI model is out. What does it mean for a small team?',
  seoTitle: 'Claude 5.5: what a new AI model means for a small team',
  description: 'Anthropic released its Claude 5.5 models this autumn. What changed, what it means for a business, church or organization with a small team, and what AI still cannot do for you.',
  lede: 'For a small team, a new AI model mostly means the same work done a little better, faster and cheaper; it rarely means something you could not do before. Anthropic’s Claude 5.5 models, released between September 22 and October 7, 2026, are a good example, and the questions worth asking about them are the same for every new model.',
  published: '2026-11-19',
  keywords: ['Claude 5.5', 'Claude Opus 5.5', 'new AI model', 'AI for small teams', 'what can AI do for my business'],
  related: ['ruta', 'farzana'],
  sources: [
    { label: 'Anthropic: Claude Opus 5.5 (September 22, 2026)', href: 'https://www.anthropic.com/news/claude-opus-5-5' },
    { label: 'Anthropic: Claude Sonnet 5.5 (September 28, 2026)', href: 'https://www.anthropic.com/news/claude-sonnet-5-5' },
    { label: 'Anthropic: Claude Haiku 5.5 (October 7, 2026)', href: 'https://www.anthropic.com/news/claude-haiku-5-5' },
  ],
  body: `
## What came out

Anthropic, the company behind Claude, released three new models this autumn, each in a different size:

- **Claude Opus 5.5** (September 22): the most capable. Anthropic says it "costs 40% less to run than Opus 5," the model before it.
- **Claude Sonnet 5.5** (September 28): the middle size, which Anthropic calls "a faster, lower-cost complement to Claude Opus 5.5."
- **Claude Haiku 5.5** (October 7): the smallest and fastest, made for quick, high-volume jobs such as summaries and sorting. Anthropic says that "on average, it now costs around 75% less to run" than Haiku 4.5.

These are the company's own claims, from its own announcements, linked at the bottom. Anthropic itself notes that "benchmark margins have become a less reliable guide to real-world differences," which is a fair warning about every model launch, including theirs.

## What that means in plain words

I use Claude every day to build software, so here is what a release like this actually changes for someone like me, and for the teams I build for.

**It gets cheaper.** This is the part that matters most for a small team. When the same work costs 40% or 75% less, things that were too expensive to run all day become affordable: an assistant that answers every customer question, a summary of every form that comes in, a check on every document.

**It gets faster.** Answers come back sooner, which matters most when a customer is waiting on the other end.

**It gets a little better.** Fewer mistakes, clearer writing, better at following long instructions. The jump from one version to the next is real, but it is usually a step, not a leap.

What it does **not** usually mean is that you need to change what you are doing. If AI was not useful for your work last month, a new model probably will not change that by itself.

## What AI can do for a small team

From my own work, the jobs it does well:

- **Answering common questions** from what you have already written down: your prices, hours, policies and services.
- **Drafting:** first versions of emails, posts, descriptions and replies, which a person then checks.
- **Reading and summarizing** long documents, forms and messages.
- **Sorting and tagging:** which enquiry is urgent, which is a quote request, which is spam.
- **Helping build software**, which is how I use it most. It makes one developer able to do noticeably more.

## What it cannot do for you

- **It cannot know what you have not told it.** If your prices are not written down anywhere, it will not get them right.
- **It can be confidently wrong.** Anything that matters (a price, a medical or legal question, a promise to a customer) needs a person to check it.
- **It cannot build relationships.** People still want to know who they are dealing with.
- **It cannot decide what your business should do.** It can help you think. The judgement is still yours.

## How to think about the next new model

There will be another release before long, from Anthropic or someone else. When it comes, three questions are enough:

1. **Is there a job I gave up on because AI was too slow, too expensive or not good enough?** That is the only place a new model is likely to change anything for you.
2. **Does it cost less for what I already do?** If so, the switch is often a small change, and the savings are real.
3. **Who checks the answers?** That does not change with any model.

## Where I have used it

I have built AI into this website, into [Ruta](/ruta) and into [Farzana Classroom](/portfolio/farzana-classroom). In each case the question was the same: what job does this save a person from, and how do we make sure a person still checks what matters?

If you want to know whether AI fits a job in your business, church or organization, [tell me about it](/get-started). Sometimes the honest answer is that it does not, and that is worth knowing too.

For the bigger questions, the hopes and the dangers, I wrote about [what I actually think about AI superintelligence](/guides/ai-superintelligence-my-take).
`,
} satisfies Article
