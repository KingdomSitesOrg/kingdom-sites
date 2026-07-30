/* The "My tools" strip: one line of everything I build with, drifting slowly
   past. Pure CSS — no JavaScript, so it works in a server component. It pauses
   when the pointer is over it, and holds still for anyone who has asked their
   system to reduce motion.

   Colour marks the group: blue for languages and platforms, green for cloud and
   data, orange for the AI work. */

const BLUE = 'border-[#0a63c9]/20 bg-[#0a63c9]/[0.07] text-[#0a4e9e]'
const GREEN = 'border-[#15803d]/20 bg-[#16a34a]/[0.08] text-[#15803d]'
const ORANGE = 'border-[#c05a2b]/22 bg-[#c05a2b]/[0.08] text-[#9c4620]'

const GROUPS: { tone: string; items: string[] }[] = [
  {
    tone: BLUE,
    items: [
      'Swift', 'SwiftUI', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Stylesheets',
      'Tailwind', 'React', 'Next.js', 'React Native', 'Expo', 'Node.js', 'SQL',
      'iOS', 'Android', 'Apple Watch', 'Websites', 'Web apps', 'Customer portals',
      'Admin dashboards', 'Widgets', 'Responsive design', 'Accessibility',
      'App Store releases',
    ],
  },
  {
    tone: GREEN,
    items: [
      'AWS', 'Lambda', 'DynamoDB', 'Supabase', 'PostgreSQL', 'Cloudflare',
      'Cloudflare Workers', 'Vercel', 'CloudKit', 'Infrastructure as code',
      'APIs', 'Authentication', 'Payments', 'Offline sync', 'Push notifications',
      'Mapbox', 'Apple Maps', 'Google Maps', 'Geofencing', 'Live location',
      'Search', 'Error monitoring', 'CI/CD', 'TestFlight', 'Xcode', 'GitHub',
    ],
  },
  {
    tone: ORANGE,
    items: [
      'Claude API', 'Amazon Bedrock', 'AI assistants in products',
      'Answers from your own data', 'Draft replies', 'AI in the workflow',
      'Agent tooling', 'Model choice and cost control', 'Evaluating what it gets wrong',
      'AI coaching for developers new to it', 'Claude Code', 'MCP servers',
    ],
  },
]

const TOOLS = GROUPS.flatMap((g) => g.items.map((label) => ({ label, tone: g.tone })))

export default function ToolTicker() {
  return (
    <div>
      <div
        className="marquee-row relative overflow-hidden py-1.5"
        style={{
          maskImage: 'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
        }}
      >
        {/* Two copies of the line, so sliding it half its width loops with no
            seam. Hidden from screen readers — the plain list below says it once. */}
        <div
          aria-hidden="true"
          className="marquee-track flex w-max gap-2.5"
          style={{ animationDuration: '120s' }}
        >
          {[...TOOLS, ...TOOLS].map((tool, i) => (
            <span
              key={`${tool.label}-${i}`}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium ${tool.tone}`}
            >
              {tool.label}
            </span>
          ))}
        </div>
      </div>

      <ul className="sr-only">
        {TOOLS.map((tool) => (
          <li key={tool.label}>{tool.label}</li>
        ))}
      </ul>
    </div>
  )
}
