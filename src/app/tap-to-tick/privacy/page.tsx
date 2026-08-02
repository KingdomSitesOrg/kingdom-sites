import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Tap to Tick',
  description:
    'How Tap to Tick handles your budget data: stored on your device and in your own iCloud account. Tap to Tick does not run its own servers.',
  alternates: { canonical: '/tap-to-tick/privacy' },
  robots: { index: true, follow: true },
}

export default function TapToTickPrivacy() {
  return (
    <div className="doc">
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: August 2026</p>
      <div className="banner">
        Your ledger lives in your Apple iCloud account. Tap to Tick does not run its own servers.
      </div>

      <h2>Summary</h2>
      <p>
        Tap to Tick (the app, its Lock Screen and Home Screen widgets, and its Apple Watch companion) is a
        personal expense tracker. There is no Tap to Tick account system, no analytics, and no advertising.
        Sign-in is your existing Apple ID / iCloud account at the system level. Tap to Tick does not operate
        a database that stores your budget.
      </p>

      <h2>Where your budget data lives</h2>
      <p>
        Every entry you log — income, expenses, cash withdrawals, categories, budgets, account balances,
        optional place pins, and who logged a purchase — is stored first on your device.
      </p>
      <p>
        When you are signed into iCloud and sync is available, that same ledger is synchronized through{' '}
        <strong>Apple CloudKit</strong> into <strong>your own</strong>{' '}
        iCloud account (and, if you invite someone,
        into a shared iCloud zone both of you can access). Apple bills any storage to the record owner&apos;s
        iCloud quota.
      </p>
      <ul>
        <li>Without iCloud sign-in, the app works fully offline on the device; sync is simply unavailable until you sign in via system Settings.</li>
        <li>Widgets and Apple Watch still use Apple&apos;s app-group and Watch Connectivity mechanisms on your devices.</li>
        <li>There is no Tap to Tick login screen on iPhone. Identity for sync is the system iCloud session.</li>
      </ul>

      <h2>Sharing with another person</h2>
      <p>
        You may invite others to the same ledger using Apple&apos;s
        system share sheet (for example Messages). That person receives access through CloudKit sharing.
        Either of you can leave or stop sharing; when access ends, the participant&apos;s window onto the
        owner&apos;s records goes away. Export a CSV from Settings or History before leaving if you want a
        personal copy of the history.
      </p>

      <h2>Optional location on purchases</h2>
      <p>
        If you allow <strong>Location While Using the App</strong>, Tap to Tick may take a one-shot location
        fix when you save a purchase on the phone and store a loose place (approximate coordinates and an
        optional short label) with that entry so you can review it later on Apple Maps inside the app.
      </p>
      <ul>
        <li>Location is used only for this optional place-on-purchase feature.</li>
        <li>
          Location is not sent to Tap to Tick servers — there are none. When iCloud sync is on, place fields
          sync with the entry inside your iCloud budget like other entry fields.
        </li>
        <li>If you deny location permission, or a fix is unavailable or slow, logging a purchase still works; the entry is simply saved without a place.</li>
        <li>Lock Screen widget and Apple Watch log paths do not require location for success.</li>
      </ul>

      <h2>Third parties</h2>
      <p>
        Tap to Tick does not use third-party analytics SDKs, crash reporters, or ad networks. Sync uses Apple
        CloudKit. Maps shown for purchase places use Apple MapKit.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        Tap to Tick does not knowingly collect data from children. Budget data is stored on device and, when
        sync is enabled, in the user&apos;s (or share owner&apos;s) Apple iCloud account under Apple&apos;s
        terms.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If how Tap to Tick handles ledger data changes further, this page will be updated and the date above
        will change.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href="mailto:thomas@kingdom-sites.com">thomas@kingdom-sites.com</a>
      </p>

      <div className="doc-footer">
        <Link href="/tap-to-tick">&larr; Back to Tap to Tick</Link>
        <br />
        <br />© {new Date().getFullYear()} Thomas Klein. All rights reserved.
      </div>
    </div>
  )
}
