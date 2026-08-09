/**
 * Blog posts for local SEO and practical advice.
 * Written for Rochester, MN owners first; useful anywhere the phone has to ring.
 */

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string }

export type BlogPost = {
  slug: string
  title: string
  description: string
  /** ISO date YYYY-MM-DD */
  date: string
  tags: string[]
  keywords: string[]
  excerpt: string
  body: BlogBlock[]
}

export const POSTS: BlogPost[] = [
  {
    slug: 'grow-local-business-rochester-mn',
    title: 'How to grow a local business in Rochester, MN (without paying for ads every day)',
    description:
      'Practical ways Rochester small businesses get more clients: Google listing, website, reviews, and showing up for the searches people actually type.',
    date: '2026-08-03',
    tags: ['Rochester MN', 'Growing a business', 'Local SEO'],
    keywords: [
      'grow local business Rochester MN',
      'get more clients Rochester',
      'small business growth Minnesota',
      'find customers Rochester MN',
    ],
    excerpt:
      'If your customers live in Rochester or drive in for Mayo visits, growth starts with being findable when they search — not with another flyer that gets thrown away.',
    body: [
      {
        type: 'p',
        text: 'Rochester is a real local market: Mayo traffic, downtown workers, suburbs like Byron and Stewartville, and owners who still get most of their work from people who already know them. That is fine until you need more clients than word of mouth can supply.',
      },
      {
        type: 'p',
        text: 'Growing a local business here usually means three jobs at once: getting found by new people, looking trustworthy when they find you, and making it easy to call. Most of that happens on a phone, on Google, before anyone ever walks into your shop or drives past your truck.',
      },
      {
        type: 'h2',
        text: 'What “growing” actually looks like for a Rochester owner',
      },
      {
        type: 'p',
        text: 'For a landscaper, painter, coffee shop, or bike shop, growth is not a viral post. It is a steadier calendar: more quote requests, more tables filled midweek, more service calls from people who typed something like “lawn care Rochester MN” or “coffee near Mayo Clinic.”',
      },
      {
        type: 'ul',
        items: [
          'New clients who never heard of you from a neighbour',
          'Repeat customers who can find your hours and phone number in one tap',
          'Reviews that make a stranger comfortable choosing you over the next name on the map',
          'A website that loads fast and tells people what you do and where you work',
        ],
      },
      {
        type: 'h2',
        text: 'Start with Google, not a brochure site',
      },
      {
        type: 'p',
        text: 'When someone in Rochester needs a service, they open Maps. Your Google Business Profile is the front door. Categories, service areas, hours, photos of real jobs, and recent posts matter more than a logo on a homepage nobody bookmarks.',
      },
      {
        type: 'p',
        text: 'If the listing is half-filled, has old hours, or no photos since 2022, you are quietly losing people to the business next door — even if your work is better.',
      },
      {
        type: 'h2',
        text: 'Then own the searches that mean “I need help”',
      },
      {
        type: 'p',
        text: 'People type the service plus the town: “pressure washing Rochester”, “bike repair near me”, “best coffee downtown Rochester”. A one-page website cannot answer all of those. Pages for each service and each town you cover give Google something real to match — and give the customer a reason to call you instead of scrolling past.',
      },
      {
        type: 'quote',
        text: 'Ads stop when you stop paying. A clear page that ranks keeps bringing calls months later. That is why growth for local businesses is monthly work, not a one-time build.',
      },
      {
        type: 'h2',
        text: 'Ask for reviews while people are still happy',
      },
      {
        type: 'p',
        text: 'In a town the size of Rochester, reviews compound. Ten honest five-star notes from local customers beat a glossy brand film. Put the review link in their hand the day the job finishes — text, QR card, or a follow-up that does not sound like marketing copy.',
      },
      {
        type: 'h2',
        text: 'What this has to do with Kingdom Sites',
      },
      {
        type: 'p',
        text: 'Kingdom Sites main work is product ownership for custom software — for founders who keep shipping features. Websites and local search still get help when useful, scoped after a conversation, not as a fixed SEO plan menu.',
      },
      {
        type: 'p',
        text: 'If that sounds useful, email thomas@kingdom-sites.com — no obligation, just an honest conversation about what you need.',
      },
    ],
  },
  {
    slug: 'get-more-clients-rochester-mn',
    title: 'How Rochester businesses get more clients (and stop relying only on referrals)',
    description:
      'Referrals are gold in Rochester — until they are not enough. Here is how local businesses find new clients through Google, events, and a site that actually works.',
    date: '2026-08-03',
    tags: ['Clients', 'Rochester MN', 'Marketing'],
    keywords: [
      'get more clients Rochester MN',
      'find new customers local business',
      'Rochester small business marketing',
      'growing client base Minnesota',
    ],
    excerpt:
      'Word of mouth built most Rochester businesses. The ones that keep growing also show up when strangers search — and they make calling feel obvious.',
    body: [
      {
        type: 'p',
        text: 'Every owner in Rochester has a story that starts with “so-and-so referred me.” Referrals are still the best clients. The problem is math: referrals scale with how many happy customers you already have, not with how many people in Olmsted County need you this month.',
      },
      {
        type: 'h2',
        text: 'Where new clients actually come from now',
      },
      {
        type: 'ul',
        items: [
          'Google Maps and “near me” searches from phones',
          'Someone comparing three websites after a Facebook group recommendation',
          'A visitor in town for Mayo looking for food, coffee, or a last-minute repair',
          'Seasonal spikes — spring lawn work, fall painting, winter snow, summer bike tune-ups',
        ],
      },
      {
        type: 'p',
        text: 'If you are invisible in those moments, the referral engine is the only engine running. That feels fine in a good year and terrifying in a quiet one.',
      },
      {
        type: 'h2',
        text: 'Make it stupidly easy to choose you',
      },
      {
        type: 'p',
        text: 'New clients are not “finding people” in the abstract. They are deciding under time pressure. Your job online is to remove doubt: who you are, what you do, where you work, what it costs if you can say, and a phone number or form that works on a phone.',
      },
      {
        type: 'ul',
        items: [
          'Clear service list — not vague “quality solutions”',
          'Towns you serve (Rochester, Byron, Stewartville, Pine Island…)',
          'Recent photos of real work or a real shop',
          'Reviews that mention local landmarks or neighbourhoods when natural',
          'Same name, phone, and address everywhere directories list you',
        ],
      },
      {
        type: 'h2',
        text: 'Chamber rooms and coffee meetings still matter',
      },
      {
        type: 'p',
        text: 'Rochester has a working Chamber calendar — AM Espresso mornings, Business After Hours, golf and networking events through the year. Those rooms help you meet people. They do not replace the person who will never meet you and still needs a plumber Tuesday morning.',
      },
      {
        type: 'p',
        text: 'Use both: show up in person when it is worth it, and keep the online door open every hour you are not in the room.',
      },
      {
        type: 'h2',
        text: 'A simple monthly rhythm for finding clients',
      },
      {
        type: 'ul',
        items: [
          'Post two to four real job photos to Google',
          'Reply to every review — short and human',
          'Add or improve one page that answers a question people already ask you',
          'Ask three happy customers for a review while the work is fresh',
          'Check which search terms brought calls, and double down on those',
        ],
      },
      {
        type: 'quote',
        text: 'Getting more clients is less about clever slogans and more about being the business that is easy to find, easy to trust, and easy to call.',
      },
      {
        type: 'p',
        text: 'If you want help running that rhythm so you can stay on the tools or behind the counter, that is what the Kingdom Sites partnership is for — website, listing, search, and reviews handled every month.',
      },
    ],
  },
  {
    slug: 'downtown-farmers-market-rochester-local-business',
    title: 'What Rochester’s Downtown Farmers Market teaches local businesses about getting found',
    description:
      'The Peace Plaza farmers market puts local makers in front of foot traffic. Online is the same idea: show up where people already look, with something real.',
    date: '2026-08-03',
    tags: ['Local events', 'Rochester MN', 'Small business'],
    keywords: [
      'Downtown Rochester Farmers Market',
      'Rochester MN local business events',
      'Peace Plaza market small business',
      'get found local Rochester',
    ],
    excerpt:
      'Saturday mornings on Peace Plaza are full of people who came ready to buy from someone local. Most of the week, those people are on their phones instead.',
    body: [
      {
        type: 'p',
        text: 'Rochester’s Downtown Farmers Market is one of the clearest pictures of local commerce in the city: Peace Plaza, Saturday mornings in season, growers and makers, people walking the rows with a bag and a budget. Downtown Rochester and Experience Rochester both point visitors there for a reason — it works.',
      },
      {
        type: 'p',
        text: 'If you sell at the market, you already understand discovery: stand where the traffic is, look open, answer questions, and make the first sale easy. The mistake is treating the internet like a different planet. It is the same job with different weather.',
      },
      {
        type: 'h2',
        text: 'Foot traffic and search traffic are cousins',
      },
      {
        type: 'ul',
        items: [
          'Market booth = Google listing (where people compare options in public)',
          'Sample or display = photos and a short “what we do” on the site',
          'Conversation at the table = reviews and FAQ pages that answer real questions',
          'Business card = a site that works on a phone so they can find you again on Tuesday',
        ],
      },
      {
        type: 'h2',
        text: 'What market vendors get wrong online',
      },
      {
        type: 'p',
        text: 'Plenty of excellent Rochester makers still rely only on Instagram or a Facebook page with no hours, no map pin, and no way for a Mayo visitor to tell if you are open this week. When someone searches “farmers market Rochester MN” or “local gifts downtown Rochester,” the businesses with a clear listing and a simple site win the second sale — the one after the market closes.',
      },
      {
        type: 'h2',
        text: 'If you are not a vendor, still learn the lesson',
      },
      {
        type: 'p',
        text: 'Lawn companies, painters, cafés, and bike shops do not need a Peace Plaza stall. They need the same discipline: be present where customers already look, look active, and make the next step obvious. For most of the week, that place is Google — not a flyer under a windshield wiper.',
      },
      {
        type: 'quote',
        text: 'A market without a sign is a hobby. A business without a listing is hoping the right people already know your name.',
      },
      {
        type: 'p',
        text: 'Kingdom Sites helps Rochester businesses stay “set up at the market” online every day of the week — listing, site, photos, and search work on a monthly plan so you can focus on the product or the job.',
      },
    ],
  },
  {
    slug: 'rochester-coffee-shops-getting-found',
    title: 'How Rochester coffee shops and cafés get found (beyond the regulars)',
    description:
      'Cafe Steam, MOKA, and independent cafés win on product — but multi-location coffee in Rochester still needs Google, hours, and a site visitors can trust.',
    date: '2026-08-03',
    tags: ['Coffee shops', 'Rochester MN', 'Restaurants'],
    keywords: [
      'Rochester MN coffee shops',
      'Cafe Steam Rochester',
      'get more customers café Rochester',
      'local coffee shop marketing Minnesota',
    ],
    excerpt:
      'Rochester has real independent coffee culture. The shops that grow still make it easy for a stranger with ten minutes and a phone to choose them.',
    body: [
      {
        type: 'p',
        text: 'Rochester’s coffee scene is not theoretical. Cafe Steam runs multiple spots including Broadway and Discovery Square. MOKA has been part of downtown life for years. Visitors and locals both use “coffee near me” the same way they use a map of parking garages — fast, mobile, and unforgiving if your hours are wrong.',
      },
      {
        type: 'h2',
        text: 'What a café is competing for',
      },
      {
        type: 'p',
        text: 'You are not only competing with the shop two blocks over. You are competing with the default choice: the lobby coffee in a hotel, the drive-thru, or “we’ll just go back to the room.” For Mayo families and conference traffic, discovery is often Maps + reviews + a photo of the interior.',
      },
      {
        type: 'ul',
        items: [
          'Accurate hours for every location (especially holiday and late nights)',
          'Separate Google listings when you have more than one address',
          'Photos that look like this year, not the opening week five years ago',
          'A simple site or ordering path that works on a phone queueing for Wi‑Fi',
          'Reviews that mention neighbourhoods: Broadway, St Marys, Discovery Square',
        ],
      },
      {
        type: 'h2',
        text: 'Locals already love you — visitors have never heard of you',
      },
      {
        type: 'p',
        text: 'Regulars are loyalty. Growth is the person who landed at RST, has a morning free, and types “best coffee Rochester MN.” If another shop owns that search and your listing is thin, you never get the chance to win them with the drink.',
      },
      {
        type: 'h2',
        text: 'What restaurants and cafés should post',
      },
      {
        type: 'p',
        text: 'Google posts and fresh photos are not vanity. They signal an open business. Seasonal drinks, patio weather, a new sandwich, late hours for downtown events — those are the same messages you put on a chalkboard, just readable from a hotel room.',
      },
      {
        type: 'quote',
        text: 'Great coffee gets people to come back. Being findable is what gets them in the first time.',
      },
      {
        type: 'p',
        text: 'If your café’s online presence is a neglected Facebook page and a website that has not been touched since the last remodel, a monthly partnership that keeps the listing and site current is often cheaper than another slow Tuesday.',
      },
    ],
  },
  {
    slug: 'bike-friendly-rochester-local-shops',
    title: 'Bike-friendly Rochester: what local bike shops and outdoor businesses should do online',
    description:
      'Rochester invests in walking and biking. Bike shops and outdoor businesses can ride that interest — if they show up when people search for repairs, rentals, and gear.',
    date: '2026-08-03',
    tags: ['Bike shops', 'Rochester MN', 'Local SEO'],
    keywords: [
      'bike shops Rochester MN',
      'Rochester MN bicycle repair',
      'bike friendly Rochester marketing',
      'local outdoor business SEO Minnesota',
    ],
    excerpt:
      'As the city plans for more walking and biking, more people will need service, gear, and advice — and they will look it up on a phone first.',
    body: [
      {
        type: 'p',
        text: 'Rochester has been pushing active transportation for years: trails, Complete Streets thinking, and planning work aimed at making it easier to walk and bike. That is not abstract policy for a bike shop — it is a long tail of flat tires, tune-ups, family bikes, and “where do I ride with kids this weekend?” questions.',
      },
      {
        type: 'h2',
        text: 'What people type when the chain comes off',
      },
      {
        type: 'ul',
        items: [
          'bike repair Rochester MN',
          'bike shop near me',
          'e-bike service Rochester',
          'bike rental Rochester Minnesota',
          'kids bike Rochester',
        ],
      },
      {
        type: 'p',
        text: 'If your Google listing does not list those services, or your site is a single page with a 2019 inventory PDF, the shop across town with clearer pages and fresher reviews wins the panicked Saturday morning call.',
      },
      {
        type: 'h2',
        text: 'Local knowledge is your edge — put it where Google can see it',
      },
      {
        type: 'p',
        text: 'You know the trails, the hills, the winter storage problem, and which tires handle spring gravel. Short posts and pages that answer real questions (“winter bike storage Rochester”, “family-friendly rides near downtown”) do double duty: they help customers and they give search engines a reason to treat you as the local authority.',
      },
      {
        type: 'h2',
        text: 'Seasonal businesses need seasonal online work',
      },
      {
        type: 'p',
        text: 'Spring tune-up season is not the time to discover your hours are wrong on Google. Plan the same way you plan inventory: update service pages before the rush, post photos of the workbench mid-season, and capture reviews when someone picks up a bike that shifts cleanly again.',
      },
      {
        type: 'quote',
        text: 'A bike-friendly city only helps shops that are easy to find when something breaks.',
      },
      {
        type: 'p',
        text: 'Kingdom Sites works with local shops the same way as trades: website, Google listing, search pages, and reviews kept current so the online side matches the reputation you already have on the trail.',
      },
    ],
  },
  {
    slug: 'rochester-chamber-events-and-getting-found-online',
    title: 'Chamber events in Rochester are useful — they are not a substitute for Google',
    description:
      'AM Espresso, Business After Hours, and Chamber Cup put you in the room. Here is how to pair Rochester networking with a site and listing that work when you are not there.',
    date: '2026-08-03',
    tags: ['Local events', 'Chamber', 'Rochester MN'],
    keywords: [
      'Rochester Area Chamber of Commerce events',
      'Business After Hours Rochester MN',
      'networking vs Google local business',
      'Rochester small business growth',
    ],
    excerpt:
      'The Rochester Area Chamber fills a real calendar. Use it — and still fix the online front door that strangers use without shaking your hand.',
    body: [
      {
        type: 'p',
        text: 'The Rochester Area Chamber of Commerce runs a steady lineup: early AM Espresso gatherings, Business After Hours, championship-style events like Chamber Cup, and bigger moments such as the Economic Summit at Mayo Civic Center. For owners who like rooms full of people, that calendar is gold.',
      },
      {
        type: 'h2',
        text: 'What networking does well',
      },
      {
        type: 'ul',
        items: [
          'Warm introductions to other owners and decision-makers',
          'Local reputation among people who already care about Rochester business',
          'Partnerships you will not find on a cold email list',
        ],
      },
      {
        type: 'h2',
        text: 'What networking cannot do alone',
      },
      {
        type: 'p',
        text: 'It cannot catch the homeowner in Cascade Township who needs a roof quote this week. It cannot catch the visitor searching for dinner after a clinic appointment. It cannot work at 10pm when you are asleep and someone is still comparing three painters on their phone.',
      },
      {
        type: 'p',
        text: 'Those people use search. If your name is strong in the Chamber room and weak on Maps, you have only half a growth plan.',
      },
      {
        type: 'h2',
        text: 'A practical split of effort',
      },
      {
        type: 'ul',
        items: [
          'Pick the Chamber events where you will actually talk to people who buy what you sell',
          'Spend the rest of the “marketing” budget on being findable: listing, site, reviews, service pages',
          'After every event, make sure a new contact can Google your business name and land somewhere current',
          'Do not print a QR code to a broken homepage — fix the homepage first',
        ],
      },
      {
        type: 'quote',
        text: 'Handshakes open doors. Search fills the calendar between events.',
      },
      {
        type: 'p',
        text: 'If you want help with a website or local search while you work the room — or ownership of a custom product — email thomas@kingdom-sites.com. Scope after a conversation, not a self-serve funnel.',
      },
    ],
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
