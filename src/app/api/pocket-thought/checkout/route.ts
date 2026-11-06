import { NextResponse } from "next/server";
import { validAmount } from "@/app/pocket-thought/_lib/config";
import { checkoutForm, stripeKey } from "@/app/pocket-thought/_lib/server";

export async function POST(req: Request) {
  let body: { amount?: unknown; agreed?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (body.agreed !== true) {
    return NextResponse.json({ error: "terms_not_accepted" }, { status: 400 });
  }
  if (!validAmount(body.amount)) {
    return NextResponse.json({ error: "bad_amount" }, { status: 400 });
  }

  const check = stripeKey();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.error === "not_connected" ? 503 : 403 });
  }

  const origin = new URL(req.url).origin;
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${check.key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: checkoutForm(body.amount, origin),
  });
  const data = (await res.json()) as { url?: string };
  if (!res.ok || !data.url) {
    return NextResponse.json({ error: "stripe_error" }, { status: 502 });
  }
  return NextResponse.json({ url: data.url });
}
