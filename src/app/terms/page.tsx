export const metadata = {
  title: 'Terms of Service — Kingdom Sites',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Terms of Service</h1>
      <p className="mb-10 text-sm text-muted">Last updated: March 15, 2026</p>

      <section className="space-y-10 text-[15px] leading-relaxed text-body">

        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">1. Project Scope &amp; Methodology</h2>
          <div className="space-y-3">
            <p>
              <span className="font-medium text-ink">Deliverables:</span> The deliverables
              for each engagement — website, mobile app, platform, or other custom software — are
              defined in the individual project quote. Web projects are built on a high-performance
              Next.js framework with an SEO-optimized structure.
            </p>
            <p>
              <span className="font-medium text-ink">The Solo Developer:</span> Kingdom Sites
              is a specialized, solo-operated freelancer. To maintain code integrity and project speed,
              I work exclusively within my own established processes, design flows, and tech stack
              (Next.js/Vercel). I work hand in hand with the client but I do not collaborate with
              outside developers or &ldquo;hand-off&rdquo; incomplete code to third parties during
              the build phase.
            </p>
            <p>
              <span className="font-medium text-ink">Exclusions:</span> The quoted price
              covers the scope agreed in the quote only. Features requested beyond the agreed
              scope (e.g., additional integrations, portals, or modules) are scoped and quoted
              separately.
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">2. Payment Terms &amp; Service Integration</h2>
          <div className="space-y-3">
            <p>
              <span className="font-medium text-ink">Deposit:</span> A non-refundable $100
              commitment fee is required to secure your spot and begin architecture.
            </p>
            <p>
              <span className="font-medium text-ink">Final Payment:</span> The remaining
              quoted balance is due upon project completion or 30 days after the start date,
              whichever comes first.
            </p>
            <p>
              <span className="font-medium text-ink">Ongoing care:</span>{' '}
              Monthly product retainers (design, build, ship, and maintain) and any agreed hosting or care are as described in the
              engagement terms at the time of agreement (complexity bands Focused, Full, or
              Intensive — or project-specific quotes where that applies).
            </p>
            <p>
              <span className="font-medium text-ink">Refund Eligibility:</span> Fees (minus
              deposit) are only refundable if Kingdom Sites fails to deliver a functional
              &ldquo;Beta,&rdquo; abandons the project for 14+ business days, or fails to resolve
              a critical security vulnerability before hand-off.
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">3. The Content Deadline </h2>
          <div className="space-y-3">
            <p>
              The client or agency must provide all text, branding assets, and photography within 14 days
              of the project start.
            </p>
            <p>
              If content is not provided within this window, the project is moved to
              &ldquo;Maintenance Mode.&rdquo; The final payment remains due to maintain server
              resources and hold the development slot.
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">4. Revision &amp; Maintenance Policy</h2>
          <div className="space-y-3">
            <p>
              <span className="font-medium text-ink">Revisions:</span> Includes three rounds
              of revisions on the &ldquo;Beta&rdquo; version. Post-launch requests or changes
              exceeding the initial scope will result in a $50 per hour billing fee. 
            </p>
            <p>
              <span className="font-medium text-ink">Stability Period:</span> A 30-day
              Stability Period begins at launch. During this time, I focus exclusively on performance
              monitoring and security. Routine content updates included in your monthly plan commence
              after this 30-day window.
            </p>
            <p>
              <span className="font-medium text-ink">Maintenance Definition:</span> Monthly
              fees cover hosting, security monitoring, and up to two (1) hour minor content updates
              (text swaps, image changes) per month.
            </p>
            <p>
              <span className="font-medium text-ink">Major Updates:</span> Requests exceeding
              one hour of labor or requiring structural changes are classified as &ldquo;Major
              Updates&rdquo; and will be quoted separately.
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">5. Ownership &amp; Security Access</h2>
          <div className="space-y-3">
            <p>
              <span className="font-medium text-ink">Ownership:</span> The client owns the
              website content, domain, and assets 100% upon receipt of the final payment.
            </p>
            <p>
              <span className="font-medium text-ink">Technical Access:</span> If Kingdom Sites
              host (preferred) Kingdom Sites retains administrative access to the hosting and
              database environment to perform the mandatory maintenance and security updates.
            </p>
             <p>
              <span className="font-medium text-ink">Subject to Change</span> Kingdom Sites reserves the right to adjust the terms of service at any time. 
              Kingdom Sites must notify all clients / agencies upon change. 
            </p>
            <p>
              <span className="font-medium text-ink">White Label Clause (If Applicable):</span> For
              agency partners, I operate as a &ldquo;Work for Hire&rdquo; developer. Ownership of
              the end-product is governed by the specific partnership agreement.
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">Contact</h2>
          <p>
            Please reach out if you have any questions: {' '}
            <a
              href="mailto:thomas@kingdom-sites.com"
              className="underline underline-offset-2 hover:text-ink"
            >
              thomas@kingdom-sites.com 
            </a>
          </p>
        </div>

      </section>
    </main>
  )
}
