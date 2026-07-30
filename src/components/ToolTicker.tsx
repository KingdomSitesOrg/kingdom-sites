/* The "My tools" strips: three rows of everything I build with, sliding past at
   different speeds. Pure CSS — no JavaScript, so it works in a server component.
   Rows pause when the pointer is over them, and hold still for anyone who has
   asked their system to reduce motion. */

type Row = {
  /* A colour per row so the three read as three groups at a glance. */
  tone: string
  /* Seconds for one full pass. Slower rows read as calmer. */
  seconds: number
  reverse?: boolean
  items: string[]
}

const ROWS: Row[] = [
  {
    tone: 'border-[#0a63c9]/20 bg-[#0a63c9]/[0.07] text-[#0a4e9e]',
    seconds: 46,
    items: [
      'Swift', 'SwiftUI', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Stylesheets',
      'Tailwind', 'React', 'Next.js', 'React Native', 'Expo', 'Node.js', 'SQL',
      'iOS', 'Android', 'Apple Watch', 'Websites', 'Web apps', 'Customer portals',
      'Admin dashboards', 'Widgets', 'Responsive design', 'Animation',
      'Accessibility', 'App Store releases',
    ],
  },
  {
    tone: 'border-[#15803d]/20 bg-[#16a34a]/[0.08] text-[#15803d]',
    seconds: 58,
    reverse: true,
    items: [
      'AWS', 'Lambda', 'DynamoDB', 'Supabase', 'PostgreSQL', 'Cloudflare',
      'Cloudflare Workers', 'Vercel', 'CloudKit', 'StoreKit', 'Infrastructure as code',
      'APIs', 'Authentication', 'Payments', 'Offline sync', 'Push notifications',
      'Mapbox', 'Apple Maps', 'Google Maps', 'Geofencing', 'Live location',
      'Search', 'Error monitoring', 'CI/CD', 'TestFlight', 'Xcode', 'GitHub',
    ],
  },
  {
    tone: 'border-[#c05a2b]/22 bg-[#c05a2b]/[0.08] text-[#9c4620]',
    seconds: 50,
    items: [
      'Claude API', 'Amazon Bedrock', 'AI assistants in products',
      'Answers from your own data', 'Draft replies', 'AI in the workflow',
      'Agent tooling', 'Model choice and cost control', 'Evaluating what it gets wrong',
      'AI coaching for developers new to it', 'Claude Code', 'MCP servers',
    ],
  },
]

function TickerRow({ tone, seconds, reverse, items }: Row) {
  return (
    <div
      className="marquee-row relative overflow-hidden py-1.5"
      style={{
        maskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
      }}
    >
      {/* Two copies so the loop has something to slide into. Hidden from screen
          readers — the plain list below carries the same words once. */}
      <div
        aria-hidden="true"
        className="marquee-track flex w-max gap-2.5"
        style={{
          animationDuration: `${seconds}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium ${tone}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ToolTicker() {
  return (
    <div>
      <div className="space-y-1">
        {ROWS.map((row) => (
          <TickerRow key={row.items[0]} {...row} />
        ))}
      </div>

      {/* The same words, once each, for screen readers and search engines. */}
      <ul className="sr-only">
        {ROWS.flatMap((row) => row.items).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
