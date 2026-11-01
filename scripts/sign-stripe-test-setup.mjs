#!/usr/bin/env node
// Create Kingdom Sites Sign's two monthly prices in a Stripe TEST account, once.
// Prices are found by lookup key, so running it again changes nothing.
// Usage: STRIPE_SECRET_KEY=sk_test_… node scripts/sign-stripe-test-setup.mjs
// Refuses a live key: live prices are made by hand in the Stripe dashboard
// with the same lookup keys (see the pull request).

const PLANS = [
  { lookupKey: 'sign_starter_monthly', name: 'Sign Starter', cents: 100 },
  { lookupKey: 'sign_growth_monthly', name: 'Sign Growth', cents: 1000 },
]

const key = process.env.STRIPE_SECRET_KEY?.trim() || ''
if (!key.startsWith('sk_test_')) {
  console.error('Set STRIPE_SECRET_KEY to a TEST key (sk_test_…). Live keys are refused.')
  process.exit(1)
}

async function stripe(method, path, params = {}) {
  const body = new URLSearchParams(params).toString()
  const res = await fetch(`https://api.stripe.com/v1${path}${method === 'GET' && body ? `?${body}` : ''}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'POST' ? body : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `${method} ${path} failed`)
  return data
}

for (const plan of PLANS) {
  const found = await stripe('GET', '/prices', { 'lookup_keys[]': plan.lookupKey })
  if (found.data.length) {
    console.log(`${plan.lookupKey}: already there (${found.data[0].unit_amount / 100} ${found.data[0].currency})`)
    continue
  }
  const product = await stripe('POST', '/products', { name: plan.name, 'metadata[app]': 'kingdom-sites-sign' })
  const price = await stripe('POST', '/prices', {
    product: product.id,
    unit_amount: String(plan.cents),
    currency: 'usd',
    'recurring[interval]': 'month',
    lookup_key: plan.lookupKey,
  })
  console.log(`${plan.lookupKey}: created (${price.unit_amount / 100} ${price.currency} a month)`)
}
