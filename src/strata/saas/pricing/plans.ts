/** Plans (STORYBOARD 7.7). Annual prices are derived from the monthly list price, never typed. */
export type Billing = 'monthly' | 'annual';
export type PlanId = 'maker' | 'studio' | 'enterprise';

export const ANNUAL_SAVING_PCT = 20;
export const TRIAL_DAYS = 14;

export type Plan = {
  id: PlanId;
  name: string;
  /** List price per month, billed monthly (USD). */
  monthly: number;
  /** Enterprise prices are a floor ("From $1,500 / month"). */
  from?: boolean;
  highlighted?: boolean;
  badge?: string;
  pitch: string;
  cta: string;
  /** First feature reads as a heading ("Everything in Studio"). */
  inherits?: string;
  features: readonly string[];
};

export const PLANS: readonly Plan[] = [
  {
    id: 'maker',
    name: 'Maker',
    monthly: 25,
    pitch: 'For makers and one-person teams.',
    cta: `Start free for ${TRIAL_DAYS} days`,
    features: [
      '20 AI model generations a month',
      'Optimization up to 50k\u00A0elements',
      'Instant quotes on every material',
      'FDM and SLA printing at list price',
      'STL, STEP and 3MF export',
      'Community support',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    monthly: 125,
    highlighted: true,
    badge: 'Most teams pick this',
    pitch: 'For product teams shipping hardware.',
    cta: 'Start Studio trial',
    features: [
      'Unlimited AI generations',
      'Full generative optimization with stress reports',
      'All four processes, including metal',
      '12% off every print order',
      'Priority queue, 24\u00A0h faster on average',
      '5 seats and a shared part library',
      'API access, 10,000 calls a month',
      'Chat and email support, 4\u00A0h response',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 1500,
    from: true,
    pitch: 'For production lines and regulated parts.',
    cta: 'Talk to sales',
    inherits: 'Everything in Studio',
    features: [
      'Reserved print cells and capacity',
      'Volume pricing from 25% off',
      'AS9100 and ISO\u00A013485 production lines',
      'SSO, SCIM and audit logs',
      'Unlimited API calls with webhooks',
      'A named application engineer',
      '99.9% uptime SLA',
    ],
  },
];

/** Price per month on the given billing cycle (whole dollars). */
export function perMonth(plan: Plan, billing: Billing): number {
  return billing === 'annual' ? (plan.monthly * (100 - ANNUAL_SAVING_PCT)) / 100 : plan.monthly;
}

export function billedYearly(plan: Plan): number {
  return perMonth(plan, 'annual') * 12;
}

export const usd = (n: number) => `$${n.toLocaleString('en-US')}`;
