import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'

export const metadata = {
  title: 'Privacy Policy — Kingdom Sites',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Privacy Policy</h1>
      <p className="mb-10 text-sm text-muted">Last updated: July 25, 2026</p>

      <section className="space-y-8 text-[15px] leading-relaxed text-body">
        <div>
          <h2 className="mb-2 font-semibold text-ink">Information We Collect</h2>
          <p>
            This website has no contact form, no sign-in, no accounts, and no customer database.
            It does not ask you for your name, email address, or any other personal detail, and
            nothing you do on these pages is stored by us.
          </p>
          <p className="mt-3">
            If you email {CONTACT_EMAIL}, that message and your email address sit in the email
            inbox, as any email would, and are used only to reply to you and to discuss the work.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-ink">Visitor Measurements</h2>
          <p>
            The site uses Vercel Analytics and Speed Insights to count page views and measure
            loading speed. These are aggregate measurements without cookies, and they do not
            identify individual visitors. Error reports from the site may be sent to Sentry so
            faults can be diagnosed.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-ink">Third-Party Services</h2>
          <p>
            The site is hosted on Vercel, whose servers process requests in order to deliver these
            pages. Payments for client projects are handled separately through Wise, which collects
            what it needs to process a payment. Nothing about payments happens on this website.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-ink">Client Project Information</h2>
          <p>
            During a project, Kingdom Sites may hold information you share for the work itself —
            copy, images, credentials, and similar material. It is used only to build and maintain
            your project, is never sold, and is returned or removed on request when the engagement
            ends.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-ink">Your Rights</h2>
          <p>
            You may ask what information is held about you and request its correction or deletion
            by emailing the address below.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-ink">Contact</h2>
          <p>
            Questions about this Privacy Policy — contact Thomas Klein at{' '}
            <a href={CONTACT_MAILTO} className="underline underline-offset-2 hover:text-ink">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
