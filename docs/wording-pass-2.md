# Wording pass 2: new copy for the final deploy (T-388 and the other content tasks)

Every new or changed sentence on the site from the visibility work, so Thomas can review it all in one sitting before the deploy. Each task adds its own section. Page, where on the page, the new text, and why.

## T-388: Guides (answer pages)

A new section at /guides: an index and five answer pages, one question each. The blog stays as it is (Rochester business notes); the guides are their own section in the blog's design, because they answer national questions and carry an author box and Article data.

**To decide:**
- The date on every guide is 30 October 2026, the day they were written. If the deploy is next week, they can be re-dated to the deploy day (one line each in `src/lib/guides.ts`).
- The fee figures were checked on 30 October 2026 against Apple, Google, Stripe, Vercel and Supabase's own pages, linked under "Sources" on each guide.
- Two sentences are new claims in Thomas's voice that no existing page says: "I will tell you plainly which one fits, even when the answer is the smaller, cheaper one" (Website or app) and "Half a page of notes, or a voice memo's worth of talking, is a good start" (How a quote works).

### Around the guides (all five pages)

| Page, where | New text | Why |
|---|---|---|
| Each guide, line above the heading | Guides / By Thomas Klein · the date | Says who wrote it and when, for readers and for Google |
| Each guide, "From my portfolio" | The project's name and its existing Portfolio line (no new words) | Links each answer to the work that shows it |
| Each guide, author box | Written by / Thomas Klein / Kingdom Sites · Rochester, Minnesota / I make software people actually use: websites, apps and the systems behind them. When you write to me, you get me, the person who builds it. / About me › Portfolio › | The bio sentence is the About page's own; the box is asked for in the brief |
| Guides with figures, "Sources" | Checked October 30, 2026. Fees change; each link has the current figure. | Every public figure has its source on the page |
| Each guide, closing box | Have something in mind? / Tell me about it in a few lines. You and I talk first; you get a quote once I understand the project. / Start a conversation | The soft link to Get started; same promise as the site's quote line |
| Each guide, list at the bottom | More questions people ask | Links the guides to each other |

### /guides (the index)

| Where | New text | Why |
|---|---|---|
| Search title | Guides: websites and apps, answered plainly | Unique title |
| Description | Plain answers to the questions people ask before a website or app: what a church needs, online sign-ups and payments for a school, website or app, how a quote works, and what an app costs to keep running. | Names every guide's subject |
| Label, heading | Guides / The questions people ask me, answered plainly. | One h1 in the site's voice |
| Intro | Before a website or an app, the same few questions come up. Here are my answers, the way I would give them to you in a conversation. | First person, plain |
| Each card | The guide's question, its description, "Read the answer" | |
| Last card | Have a question that is not here? / Ask me. Every enquiry comes to me, and I reply personally. / Start a conversation | Second sentence is the About page's; fills the grid's last place |

### Links to the guides from existing pages

| Page, where | New text | Why |
|---|---|---|
| Menu (every page), Studio list | Guides | Links both ways |
| Footer (every studio page; home and Portfolio footer line) | Guides | Same |
| /get-started, after "You and I talk first. You get a quote once I understand the project." | How a quote works › | Points to the quote guide where people decide to write |
| /about, link line at the bottom | · Guides | |
| /portfolio, Farzana section, next to farzana.app | Sign-ups and payments for schools › | The school guide from the project that proves it |
| /portfolio, under "Yours could be next." | How a quote works · Website or app? · All guides | |

### /guides/church-website-and-app

Why: Audit §3 "church website designer / app for my church"; visibility plan §4 answer page 1. Proof only from Prayer, Ministry, KCUPG and the About page’s free-websites offer.

| Where | New text |
|---|---|
| Search title | What a church needs from a website and app |
| Description | A church website first: service times, where you meet, what a first visit is like, giving and contact. When a church app is worth building, and when it is not. |
| Heading (h1) | What does a church need from a website and app? |
| Answer (first two sentences) | Most churches need a clear website before they need an app: service times, where you meet, what a first visit is like, how to give, and how to get in touch. An app earns its place only when your people would open it every week for something a website does poorly, such as sign-ups, groups or notifications. |
| Sub-heading | Start with the visitor’s questions |
| Start with the visitor’s questions | Someone looking for a church almost always looks you up on a phone before they come. They are not reading your history. They want a handful of answers, fast: |
| Start with the visitor’s questions, list | When and where you meet, with a map link that opens in their phone |
| Start with the visitor’s questions, list | What a first Sunday is like: parking, children, how long it lasts, what people wear |
| Start with the visitor’s questions, list | What you believe, in a few plain sentences |
| Start with the visitor’s questions, list | Who the pastor is, with a photo |
| Start with the visitor’s questions, list | How to get in touch, and how to give |
| Start with the visitor’s questions | If those five are on the first screen or one tap away, the website is doing its main job. Everything else is extra. |
| Sub-heading | Make it easy to keep up to date |
| Make it easy to keep up to date | The most common problem with church websites is not the design. It is a page that still lists last year’s Christmas service. Whoever looks after the site should be able to change a service time, add an event or post a sermon link from a phone in a minute, without calling anyone. That matters more than any feature on this page. |
| Sub-heading | Giving online |
| Giving online | Online giving is usually the first thing a church wants beyond the basics, and it does not need an app. A giving page on the website that takes a card works on every phone. Card payments carry a processing fee: Stripe’s standard US rate, for example, is 2.9% + 30¢ per successful card payment ([Stripe]). Whichever service you use, the money should go straight to the church’s own account, and the giving records should belong to the church. |
| Sub-heading | When an app is worth it |
| When an app is worth it | An app is worth building when your people would open it every week, and it does something a website cannot do well: |
| When an app is worth it, list | Notifications: a prayer request, a change to Sunday’s plans, a new sermon |
| When an app is worth it, list | Sign-ups for groups, classes, meals or volunteering, with reminders |
| When an app is worth it, list | Sermon notes, readings or a prayer guide that people use through the week |
| When an app is worth it, list | A member directory that only members can see |
| When an app is worth it | If most of what you want is announcements and service times, a website and a weekly email do that job for much less. An app also needs looking after once it is live: store fees and yearly updates. See [What does it cost to keep an app running after launch?] |
| Sub-heading | What I have built for churches and ministries |
| What I have built for churches and ministries | I built [Prayer], a kit for a weekly prayer meeting for the unreached: a verse, a story, prayer points and free guides to download. [Ministry] is my set of short, hand-drawn walkthroughs of Bible books, in English and Bangla. For Kansas City, I built the dashboard and the map for [KCUPG], so churches see which communities live where, and where to meet them. |
| What I have built for churches and ministries | Churches, ministries and missionaries raising support get their website built for free. My time is the donation, and the domain name and hosting stay in your name ([my mission]). An app, or software beyond the website, is a normal project with a quote: see [How does a quote work?] |
| Sub-heading | A short checklist |
| A short checklist, list | Service times and address on the first screen |
| A short checklist, list | A “first visit” section written for someone who has never been to church |
| A short checklist, list | A giving page that takes a card |
| A short checklist, list | One person who can update the site from a phone |
| A short checklist, list | An app only once there is something your people would open every week |

### /guides/school-sign-ups-and-payments-online

Why: Audit §3 "class sign-up and payments for schools", "software for a homeschool co-op"; answer page 2. Farzana wording is the site’s own (Portfolio line, chat file), status "in beta, first school coming soon" kept honest.

| Where | New text |
|---|---|
| Search title | Class sign-ups and payments online for a school or co-op |
| Description | Yes: families can find a class, sign up and pay by card at any hour, and the teacher gets a roster that updates itself. Stitched-together tools or one system, what card payments cost, and where to start. |
| Heading (h1) | Can a small school or co-op take sign-ups and payments online? |
| Answer (first two sentences) | Yes. A small school, a homeschool co-op or anyone who teaches classes can let families find a class, sign up and pay by card online at any hour, while the teacher gets an up-to-date list of who is enrolled. You can piece it together from a form, a payment link and a spreadsheet, or use one system that does all three; the right choice depends on how many classes and families you have. |
| Sub-heading | What sign-ups and payments need to cover |
| What sign-ups and payments need to cover, list | A list of classes with dates, times, ages and prices |
| What sign-ups and payments need to cover, list | A sign-up form that asks only what you need |
| What sign-ups and payments need to cover, list | Payment by card when the family signs up, with a receipt |
| What sign-ups and payments need to cover, list | A confirmation email: what to bring, where to go, when it starts |
| What sign-ups and payments need to cover, list | A roster the teacher can see, that updates itself |
| What sign-ups and payments need to cover, list | A way to handle full classes, waitlists, refunds and siblings |
| Sub-heading | Option 1: stitch simple tools together |
| Option 1: stitch simple tools together | For a handful of classes, an online form, a payment link and a spreadsheet can work, and it is cheap to start. The cost shows up later, in hours: matching payments to sign-ups by hand, chasing families who signed up but did not pay, copying names into a roster, and answering “did my payment go through?” emails. |
| Sub-heading | Option 2: one system |
| Option 2: one system | Once you run more than a few classes, one system that keeps classes, families and payments together gives those hours back. A family signs up and pays in one step, the roster updates, the receipt goes out by itself, and you can see who has paid without opening three tabs. |
| Option 2: one system | That is what I built [Farzana Classroom] to do. It is education software for schools, training organizations, education businesses or anyone who teaches classes, customized to your needs. Each school gets its own site, name and crest. Families find a class, try a free sample, sign up and pay online at any hour; the teacher sees who is enrolled, who was active this week and who just joined. It is in beta now, with its first school coming soon. |
| Sub-heading | What card payments cost |
| What card payments cost | Taking cards online always carries a processing fee. Stripe, which many class and payment systems use, charges 2.9% + 30¢ per successful domestic card payment on its standard US pricing ([Stripe]). On a $200 class, that is $6.10. Some schools add the fee to the price; most simply build it in. Either way, the money should land in the school’s own account. |
| Sub-heading | Families’ and children’s information |
| Families’ and children’s information | A school holds information about children, so collect only what you need, keep it behind a sign-in, and decide which staff can see what. Families should be able to see and update their own details. Before you choose any system, ask where the data is kept and how you would take it with you if you ever left. |
| Sub-heading | Where to start |
| Where to start, list | Write down one term’s classes, with their prices. |
| Where to start, list | Write down the questions you ask every family today. |
| Where to start, list | Count the hours a term goes on sign-ups and payments by hand. |
| Where to start, list | With those three, it is quick to see whether simple tools are enough, or whether one system would pay for itself. |
| Where to start | If you are weighing a website against an app for this, [Website or app: which does my business need?] walks through that choice. |

### /guides/website-or-app

Why: Answer page 3. Examples are the Portfolio projects; prices only as the chat’s rough ranges; store fees from Apple and Google with sources.

| Where | New text |
|---|---|
| Search title | Website or app: which does my business need? |
| Description | Most businesses need a website first; an app is worth it when customers come back often or need what only a phone does well. Real examples, what an app adds to the cost, and three questions to decide. |
| Heading (h1) | Website or app: which does my business need? |
| Answer (first two sentences) | Most businesses need a website first, because a website is what people find on Google and what they check before they call. An app is worth it when customers come back often to do the same thing, such as booking, ordering, tracking or learning, or when it needs something only a phone does well. |
| Sub-heading | What a website does best |
| What a website does best, list | Gets found in search and on Google Maps |
| What a website does best, list | Works on every phone and computer, with nothing to download |
| What a website does best, list | Says who you are, what you do and how to reach you |
| What a website does best, list | Takes enquiries, bookings and payments |
| What a website does best, list | Is quick and cheap to change |
| What a website does best | For many businesses, churches and organizations, a good website is all the software they need. |
| Sub-heading | What an app does best |
| What an app does best, list | Sits on the home screen, one tap away |
| What an app does best, list | Sends notifications |
| What an app does best, list | Works without a signal |
| What an app does best, list | Uses the camera, location and other phone features smoothly |
| What an app does best, list | Makes a daily habit easy |
| Sub-heading | Examples from my own work |
| Examples from my own work | [Tap to Tick], my iPhone expense app, is an app because you log a purchase in a tap or two, right when you make it, several times a day. [JAM Legio], a Latin learning game, is an app because daily practice should feel like a game, and new families find it on the App Store and Google Play. On [Ruta], the crews use a phone app because they work out in the field, sometimes without a signal, while the office works on the web. |
| Examples from my own work | The [Delta Development Project] is a website: people come to read about its work and support it, not to open it every day. [Farzana Classroom] is both: families find a class and sign up on the web, and the same school runs on phones and desktop. |
| Sub-heading | What an app adds to the cost |
| What an app adds to the cost | An app costs more to build and more to keep. Publishing it needs an Apple Developer Program membership, 99 USD a year ([Apple]), and a Google Play developer account, a one-time 25 USD fee ([Google]). Both stores review every release, and both require apps to keep up with new phone systems. [What does it cost to keep an app running after launch?] has the details. |
| What an app adds to the cost | As rough ranges, never a quote: a basic website is around $1,000 to $2,000, a basic app around $3,000 to $5,000, and more complex projects around $6,000 to $10,000 and up, depending on scope. The real figure comes once I understand the project: see [How does a quote work?] |
| Sub-heading | Three questions to decide |
| Three questions to decide, list | Will your customers use it more than once a month? If not, a website. |
| Three questions to decide, list | Does it need notifications, use without a signal, or the camera? If so, an app may be right. |
| Three questions to decide, list | Do people still need to find you in the first place? Then start with the website, and add an app once there is something worth opening every week. |
| Three questions to decide | Many projects start as a website and add an app later on the same system behind it, so nothing built first is thrown away. |
| Three questions to decide | If you are still not sure, that is a normal place to start a conversation. Tell me what your customers do today, how often they come back, and what slows you down, and I will tell you plainly which one fits, even when the answer is the smaller, cheaper one. |

### /guides/how-a-quote-works

Why: Answer page 4: Thomas’s process (talk, understand, plan and quote) from /get-started and the chat file; ranges only as ranges; timelines as the chat file states them.

| Where | New text |
|---|---|
| Search title | How a website or app quote works |
| Description | You tell me what you have in mind, we talk it through, and once I understand the project you get a plan and a quote. Rough ranges for websites and apps, what moves the price, and what to bring. |
| Heading (h1) | How does a quote work? |
| Answer (first two sentences) | You tell me what you have in mind, we talk it through, and once I understand the project you get a clear plan and a quote. There is no price list and no pressure: every project is quoted on what it actually needs. |
| Sub-heading | The four steps |
| The four steps, list | Tell me what you have in mind. A few lines on the [Start a conversation] form, or an email, is plenty. |
| The four steps, list | We talk it through. You talk to me directly, the person who builds it: what it has to do, who it is for, and what you use today. |
| The four steps, list | A plan and a quote. Once I understand the project, you get a plan in plain words: what will be built, in what order, and what it costs. |
| The four steps, list | I build it with you. You see it as it takes shape, it goes live, and I stay for the fixes and the next version. |
| Sub-heading | Why there is no price list |
| Why there is no price list | Two projects that sound the same can be very different underneath. “A website for my school” might be five pages, or it might be class sign-ups, payments and a roster for every teacher. A price list would either charge the first too much or quote the second too little. Talking first means the quote fits the project you actually have, and you know exactly what it covers before anything starts. |
| Sub-heading | Rough ranges, to give a sense of scale |
| Rough ranges, to give a sense of scale | These are ranges, not a quote: |
| Rough ranges, to give a sense of scale, list | A basic website: around $1,000 to $2,000 |
| Rough ranges, to give a sense of scale, list | A basic mobile app: around $3,000 to $5,000 |
| Rough ranges, to give a sense of scale, list | More complex projects: around $6,000 to $10,000 and up, depending on scope |
| Rough ranges, to give a sense of scale | A typical website takes a few weeks, and an app a few months, depending on scope. |
| Sub-heading | What moves the price |
| What moves the price, list | How many different pages or screens it has |
| What moves the price, list | Sign-in and accounts, and how many kinds of user (a family, a teacher, an office) |
| What moves the price, list | Payments, subscriptions and refunds |
| What moves the price, list | Connections to tools you already use: a calendar, email, accounting |
| What moves the price, list | Publishing to the App Store and Google Play |
| What moves the price, list | Moving existing records in from a spreadsheet or an old system |
| What moves the price, list | Whether the words and photos are ready, or still to be written |
| Sub-heading | What helps the first conversation |
| What helps the first conversation, list | What you do today, and what is slow or painful about it |
| What helps the first conversation, list | Who will use it, and on what: a phone, a computer, both |
| What helps the first conversation, list | A website or app you like, and what you like about it |
| What helps the first conversation, list | Any date that matters: a term start, a season, a launch |
| What helps the first conversation, list | A budget range, if you have one, so I can suggest what fits it |
| What helps the first conversation | None of this needs to be polished. Half a page of notes, or a voice memo’s worth of talking, is a good start. |
| Sub-heading | After launch |
| After launch | I build it and I maintain it, so looking after it is part of the plan from the start. For apps, some running costs are set by Apple, Google and the hosting companies, not by me: [What does it cost to keep an app running after launch?] lists them with their sources. |
| After launch | Churches, ministries and missionaries raising support get their website built for free; my time is the donation ([my mission]). If you are not yet sure whether you need a website or an app, start with [Website or app: which does my business need?] |

### /guides/cost-to-keep-an-app-running

Why: Answer page 5: only public figures, each with its source link on the page (checked 2026-10-30). Nothing about Thomas’s own prices beyond "part of the quote".

| Where | New text |
|---|---|
| Search title | What it costs to keep an app running after launch |
| Description | The real running costs of an app: Apple’s 99 USD a year, Google Play’s one-time 25 USD, the stores’ share of sales, hosting and database plans, and the yearly updates Apple and Google require. With sources. |
| Heading (h1) | What does it cost to keep an app running after launch? |
| Answer (first two sentences) | The fixed fees are small and public: Apple’s developer program is 99 USD a year, a Google Play account is a one-time 25 USD, and hosting and a database can start free and grow with use. The larger cost is keeping the app updated, because Apple and Google require apps to keep up with new phone systems, and an app nobody updates is eventually left behind. |
| Sub-heading | The store fees |
| The store fees, list | Apple Developer Program: 99 USD per membership year ([Apple]). Nonprofits, accredited schools and government bodies that sell nothing through their apps can ask Apple for a fee waiver ([Apple]). |
| The store fees, list | Google Play: a one-time 25 USD registration fee ([Google]). |
| Sub-heading | The stores’ share of sales |
| The stores’ share of sales | If the app sells something digital inside it, such as a subscription, a course or a level, the store takes a share. Apple’s Small Business Program charges 15% for developers with up to 1 million USD a year in proceeds ([Apple]). Google Play’s rates depend on the kind of purchase and where the customer is; for US subscriptions, its table lists 10% plus a 5% billing fee on the first 1 million USD a year ([Google]). |
| The stores’ share of sales | Real-world goods and services, like a lawn visit or a class taught in person, are paid by card instead, through a payment company. Stripe’s standard US rate is 2.9% + 30¢ per successful card payment ([Stripe]). |
| Sub-heading | Hosting and the database |
| Hosting and the database | Most apps have a server and a database behind them: accounts, saved data, payments. For a small app this can start free. Two public examples: Vercel’s Hobby plan is free and its Pro plan is 20 USD a month per developer seat ([Vercel]); Supabase’s free plan pauses a project after a week without activity, and its Pro plan starts at 25 USD a month ([Supabase]). An app with real users should not sit on a plan that can pause. These costs grow with use: more people, more storage, more email. |
| Sub-heading | Updates you cannot skip |
| Updates you cannot skip | Apple and Google move the ground every year. Since April 28, 2026, every app uploaded to Apple must be built with Xcode 26 and the iOS 26 tools ([Apple]). On Google Play, from August 31, 2026, new apps and updates must target Android 16, and existing apps must target at least Android 15 to stay available to new users ([Google]). |
| Updates you cannot skip | An app that is not kept up to date slowly stops being offered to people on newer phones. And when something does break, a fix cannot ship until the app has been brought up to date first, which is the worst time to find out. |
| Updates you cannot skip | There are smaller running costs too: |
| Updates you cannot skip, list | The domain name, renewed every year |
| Updates you cannot skip, list | An email service for receipts and sign-in codes |
| Updates you cannot skip, list | Error reporting, so you hear about a crash before a customer tells you |
| Updates you cannot skip, list | Security updates to the building blocks the app is made from |
| Sub-heading | And someone’s time |
| And someone’s time | The fees above are the easy part to plan for. The bigger part is time: applying the yearly updates, fixing what a new phone breaks, answering the stores’ review notes, and adding what users ask for. I build it and I maintain it, so looking after the app is part of the plan from the start, and its cost is part of the quote. See [How does a quote work?] |
| Sub-heading | A simple way to budget |
| A simple way to budget, list | Fixed: Apple 99 USD a year, Google 25 USD once, the domain name |
| A simple way to budget, list | Grows with use: hosting, database, email, and the store’s or card company’s share of sales |
| A simple way to budget, list | Time: the yearly updates, fixes and new features |
| A simple way to budget | If your plans do not need an app yet, a website avoids most of this list: see [Website or app: which does my business need?] |

