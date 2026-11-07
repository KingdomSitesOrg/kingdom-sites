import { createHash } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import {
  CHECKOUT_LINE,
  PROJECT_TAG,
  STATEMENT_SUFFIX,
  tierName,
  type PaymentSettings,
} from "./config";

type KeyCheck = { key: string } | { error: "not_connected" | "live_keys_not_allowed" };

/**
 * The Kingdom Sites Stripe key (STRIPE_SECRET_KEY). Test keys work anywhere;
 * a live key is used only by the production site, never on a dev server or preview.
 */
export function stripeKey(env: NodeJS.ProcessEnv = process.env): KeyCheck {
  const key = (env.STRIPE_SECRET_KEY ?? "").trim();
  if (/^(sk|rk)_test_/.test(key)) return { key };
  if (/^(sk|rk)_live_/.test(key)) {
    return env.VERCEL_ENV === "production" ? { key } : { error: "live_keys_not_allowed" };
  }
  return { error: "not_connected" };
}

export function paymentSettings(env: NodeJS.ProcessEnv = process.env): PaymentSettings {
  const paypal = (env.POCKET_THOUGHT_PAYPAL_ME_URL ?? "").trim().replace(/\/+$/, "");
  const venmo = (env.POCKET_THOUGHT_VENMO_USERNAME ?? "").trim().replace(/^@/, "");
  return {
    stripe: "key" in stripeKey(env),
    paypalUrl: /^https:\/\/(www\.)?paypal\.me\/[\w.-]+$/i.test(paypal) ? paypal : null,
    venmoUser: /^[\w-]{3,40}$/.test(venmo) ? venmo : null,
  };
}

/** Gifts that did not come through Stripe (PayPal, Venmo), added by hand in whole dollars. */
export function offlineUsd(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.POCKET_THOUGHT_OFFLINE_USD ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

type Intent = { amount_received: number; currency: string };
type SearchPage = { data: Intent[]; has_more: boolean; next_page?: string | null };

/** Sum of paid Pocket Thought card payments in US cents. */
export function sumUsdCents(intents: Intent[]): number {
  return intents.filter((i) => i.currency === "usd").reduce((s, i) => s + i.amount_received, 0);
}

let memo: { at: number; usd: number } | null = null;
const MEMO_MS = 60_000;

/**
 * What the progress bar shows: paid Stripe payments tagged project=pocket-thought,
 * plus POCKET_THOUGHT_OFFLINE_USD. Starts at $0. Stripe's search can lag about a minute.
 */
export async function raisedUsd(): Promise<number> {
  const offline = offlineUsd();
  const check = stripeKey();
  if (!("key" in check)) return offline;
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.usd + offline;

  let cents = 0;
  let page: string | undefined;
  try {
    for (let i = 0; i < 20; i++) {
      const q = new URLSearchParams({
        query: `metadata['project']:'${PROJECT_TAG}' AND status:'succeeded'`,
        limit: "100",
      });
      if (page) q.set("page", page);
      const res = await fetch(`https://api.stripe.com/v1/payment_intents/search?${q}`, {
        headers: { Authorization: `Bearer ${check.key}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`stripe ${res.status}`);
      const data = (await res.json()) as SearchPage;
      cents += sumUsdCents(data.data);
      if (!data.has_more || !data.next_page) break;
      page = data.next_page;
    }
  } catch {
    return (memo?.usd ?? 0) + offline;
  }
  const usd = Math.floor(cents / 100);
  memo = { at: Date.now(), usd };
  return usd + offline;
}

/**
 * Keeps one sign-up. Production: the site's private Vercel Blob store, one file per
 * address under pocket-thought/emails/. A dev server: .data/pocket-thought/emails.jsonl.
 * Nothing here sends email.
 */
export async function storeSignup(email: string): Promise<"ok" | "not_connected"> {
  const at = new Date().toISOString();
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    const id = createHash("sha256").update(email).digest("hex").slice(0, 32);
    await put(`pocket-thought/emails/${id}.json`, JSON.stringify({ email, at }), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return "ok";
  }
  if (process.env.VERCEL) return "not_connected";
  const dir = path.join(process.cwd(), ".data", "pocket-thought");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "emails.jsonl"), JSON.stringify({ email, at }) + "\n");
  return "ok";
}

/**
 * Starts a Stripe Checkout for a Pocket Thought contribution in the Kingdom Sites
 * Stripe account. Each payment is tagged project=pocket-thought so it reads apart
 * from Kingdom Sites payments and counts toward the progress bar.
 */
export function checkoutForm(amount: number, origin: string): URLSearchParams {
  const tier = tierName(amount) ?? "Custom";
  return new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(amount * 100),
    "line_items[0][price_data][product_data][name]": `Pocket Thought prototype support (${tier})`,
    "line_items[0][price_data][product_data][description]":
      "Non-refundable gift toward building the Pocket Thought prototypes. Not a purchase or a pre-order.",
    "custom_text[submit][message]": CHECKOUT_LINE,
    "metadata[project]": PROJECT_TAG,
    "metadata[tier]": tier,
    "metadata[agreed_non_refundable]": "true",
    "payment_intent_data[statement_descriptor_suffix]": STATEMENT_SUFFIX,
    "payment_intent_data[description]": `Pocket Thought prototype support (${tier})`,
    "payment_intent_data[metadata][project]": PROJECT_TAG,
    "payment_intent_data[metadata][tier]": tier,
    "payment_intent_data[metadata][agreed_non_refundable]": "true",
    success_url: `${origin}/pocket-thought?thanks=1#support`,
    cancel_url: `${origin}/pocket-thought#support`,
  });
}
