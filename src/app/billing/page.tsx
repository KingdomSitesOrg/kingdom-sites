import type { Metadata } from 'next'
import Link from 'next/link'
import { INQUIRE_CTA, INQUIRE_PATH } from '@/lib/contact'
import { PAYMENT_LINKS, PORTAL_URL, hasAnyLinks } from '@/lib/billing'
import {
 AI_PACKAGE,
 AI_PRICE_LABEL,
 ENTRY_PRICE_LABEL,
 NOTICE_LINE,
 PREPAY_LINE,
 PREPAY_OPTIONS,
 PRICING_ASTERISK,
 TIERS,
 prepaidMonthlyEquivalent,
 sixMonthTotal,
 yearTotal,
} from '@/lib/partnership'

/* Utility page for people setting up or managing a retainer — not a primary SEO target. */
export const metadata: Metadata = {
 title: 'Billing',
 description: 'Product ownership retainers — billing setup for Kingdom Sites.',
 robots: { index: false, follow: false },
}

export default function Billing() {
 const showStripe = hasAnyLinks()

 return (
  <div className="w-full overflow-x-hidden">
   <section className="hero-wash px-5 pb-12 pt-16 text-center sm:px-8 sm:pt-24">
    <div className="mx-auto max-w-2xl">
     <p className="eyebrow">Billing</p>
     <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl">
      Product ownership retainers
     </h1>
     <p className="mx-auto mt-6 text-pretty text-base leading-relaxed text-body sm:text-lg">
      Complexity is assigned after a conversation — Focused, Full, or
      Intensive. Figures below are typical monthly averages, not a
      self-serve checkout menu.
     </p>
     <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
      {PREPAY_LINE} {NOTICE_LINE}
     </p>
    </div>
   </section>

   <section aria-label="Ownership tiers" className="px-5 pb-12 sm:px-8">
    <div className="mx-auto max-w-5xl">
     <div className="grid gap-5 md:grid-cols-3">
      {TIERS.map((tier) => {
       const links = PAYMENT_LINKS[tier.id] ?? { monthly: '', annual: '' }
       const sixMonthly = prepaidMonthlyEquivalent(tier.priceAround, PREPAY_OPTIONS[1].discount)
       const yearMonthly = prepaidMonthlyEquivalent(tier.priceAround, PREPAY_OPTIONS[2].discount)

       return (
        <div key={tier.id} className="tile flex flex-col p-7">
         <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">
          {tier.tagline}
         </p>
         <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">{tier.name}</h2>
         <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">
          ~${tier.priceAround.toLocaleString()}
          <span className="text-base font-medium text-muted">/month</span>
         </p>
         <p className="mt-1 text-[13px] text-muted">
          {`6 mo prepay ~$${sixMonthly.toLocaleString()}/mo · year ~$${yearMonthly.toLocaleString()}/mo`}
         </p>
         <p className="mt-4 text-[14px] leading-relaxed text-body">{tier.promise}</p>

         <div className="mt-6 flex-1" />

         {showStripe && links.monthly ? (
          <a href={links.monthly} className="btn-primary w-full">
           Pay monthly
          </a>
         ) : (
          <Link href={INQUIRE_PATH} className="btn-primary w-full">{INQUIRE_CTA}</Link>
         )}

         {showStripe && links.annual ? (
          <a href={links.annual} className="btn-ghost mt-3 w-full">
           {`Pay year ahead — $${yearTotal(tier.priceAround).toLocaleString()}`}
          </a>
         ) : (
          <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">
           {`Or 6 months ($${sixMonthTotal(tier.priceAround).toLocaleString()}) / year ($${yearTotal(tier.priceAround).toLocaleString()}) — email for invoice.`}
          </p>
         )}
        </div>
       )
      })}
     </div>

     <p className="mx-auto mt-6 max-w-3xl text-center text-[13px] leading-relaxed text-muted">
      {PRICING_ASTERISK}
     </p>

     <div className="tile mt-8 p-7 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
       <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-warm">
         {AI_PACKAGE.tagline}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink">
         {AI_PACKAGE.name}
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-body">
         {AI_PACKAGE.promise} {AI_PACKAGE.apiNote}
        </p>
       </div>
       <p className="shrink-0 text-2xl font-semibold tracking-tight text-ink">
        {AI_PRICE_LABEL}
        <span className="text-base font-medium text-muted">/month</span>
       </p>
      </div>
      <Link href={INQUIRE_PATH} className="btn-ghost mt-5">{INQUIRE_CTA}</Link>
     </div>

     <div className="tile-elevated mt-10 p-7 sm:p-9">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Already a customer?</h2>
      {PORTAL_URL ? (
       <>
        <p className="mt-3 text-[15px] leading-relaxed text-body">
         Update payment details, download receipts, or manage your plan from the billing
         portal.
        </p>
        <a href={PORTAL_URL} className="btn-ghost mt-5">
         Manage my billing
        </a>
       </>
      ) : (
       <p className="mt-3 text-[15px] leading-relaxed text-body">
        {'To change payment method, switch tier, or end the engagement, email '}
        <Link href={INQUIRE_PATH} className="link-accent">{INQUIRE_CTA}</Link>
        {'. '}
        {NOTICE_LINE}
       </p>
      )}
     </div>

     <p className="mt-8 text-center text-sm text-body">
      {'Not signed up yet? Ownership from '}
      {ENTRY_PRICE_LABEL}
      {'/month. '}
      <Link href="/pricing" className="link-accent">
       See how ownership works <span aria-hidden="true">›</span>
      </Link>
     </p>
    </div>
   </section>
  </div>
 )
}
