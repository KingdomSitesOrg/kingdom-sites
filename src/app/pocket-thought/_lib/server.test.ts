import { describe, expect, it } from 'vitest'
import { checkoutForm, offlineUsd, paymentSettings, stripeKey, sumUsdCents } from './server'

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv

describe('Pocket Thought Stripe key', () => {
  it('uses a test key anywhere', () => {
    expect(stripeKey(env({ STRIPE_SECRET_KEY: 'sk_test_abc' }))).toEqual({ key: 'sk_test_abc' })
    expect(stripeKey(env({ STRIPE_SECRET_KEY: 'rk_test_abc', VERCEL_ENV: 'preview' }))).toEqual({ key: 'rk_test_abc' })
  })

  it('uses a live key only on the production site', () => {
    expect(stripeKey(env({ STRIPE_SECRET_KEY: 'sk_live_abc', VERCEL_ENV: 'production' }))).toEqual({ key: 'sk_live_abc' })
    expect(stripeKey(env({ STRIPE_SECRET_KEY: 'sk_live_abc', VERCEL_ENV: 'preview' }))).toEqual({ error: 'live_keys_not_allowed' })
    expect(stripeKey(env({ STRIPE_SECRET_KEY: 'rk_live_abc' }))).toEqual({ error: 'live_keys_not_allowed' })
  })

  it('reads as not connected without a key', () => {
    expect(stripeKey(env({}))).toEqual({ error: 'not_connected' })
    expect(stripeKey(env({ STRIPE_SECRET_KEY: 'pk_test_abc' }))).toEqual({ error: 'not_connected' })
    expect(paymentSettings(env({}))).toEqual({ stripe: false, paypalUrl: null, venmoUser: null })
  })
})

describe('Pocket Thought settings', () => {
  it('accepts only a paypal.me link and a plain Venmo name', () => {
    const s = paymentSettings(
      env({ POCKET_THOUGHT_PAYPAL_ME_URL: 'https://paypal.me/someone/', POCKET_THOUGHT_VENMO_USERNAME: '@some-one' }),
    )
    expect(s.paypalUrl).toBe('https://paypal.me/someone')
    expect(s.venmoUser).toBe('some-one')
    expect(paymentSettings(env({ POCKET_THOUGHT_PAYPAL_ME_URL: 'https://evil.example/x' })).paypalUrl).toBeNull()
  })

  it('counts offline gifts in whole dollars, never below zero', () => {
    expect(offlineUsd(env({}))).toBe(0)
    expect(offlineUsd(env({ POCKET_THOUGHT_OFFLINE_USD: '75.9' }))).toBe(75)
    expect(offlineUsd(env({ POCKET_THOUGHT_OFFLINE_USD: '-5' }))).toBe(0)
  })
})

describe('Pocket Thought checkout', () => {
  it('tags the payment and its card statement as Pocket Thought', () => {
    const f = checkoutForm(50, 'https://kingdom-sites.com')
    expect(f.get('metadata[project]')).toBe('pocket-thought')
    expect(f.get('payment_intent_data[metadata][project]')).toBe('pocket-thought')
    expect(f.get('payment_intent_data[statement_descriptor_suffix]')).toBe('PKTTHOUGHT')
    expect(f.get('line_items[0][price_data][unit_amount]')).toBe('5000')
    expect(f.get('metadata[tier]')).toBe('Early Supporter')
    expect(f.get('success_url')).toBe('https://kingdom-sites.com/pocket-thought?thanks=1#support')
  })

  it('totals only US dollar payments', () => {
    expect(
      sumUsdCents([
        { amount_received: 2500, currency: 'usd' },
        { amount_received: 10000, currency: 'usd' },
        { amount_received: 999, currency: 'eur' },
      ]),
    ).toBe(12500)
  })
})
