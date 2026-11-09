import { after, NextResponse } from "next/server";
import { notifyThomas } from "@/lib/notify";
import { PRICE_USD, validAnswer } from "@/app/pocket-thought/_lib/config";
import { storeAnswer } from "@/app/pocket-thought/_lib/server";

// One anonymous answer to "Would you buy it at the planned price?".
export async function POST(req: Request) {
  let body: { answer?: unknown; company?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  // A hidden field that only bots fill in.
  if (typeof body.company === "string" && body.company.length > 0) {
    return NextResponse.json({ ok: true });
  }
  if (!validAnswer(body.answer)) {
    return NextResponse.json({ error: "bad_answer" }, { status: 400 });
  }
  try {
    const result = await storeAnswer(body.answer, PRICE_USD);
    if (result === "not_connected")
      return NextResponse.json({ error: "not_connected" }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
  // Thomas asked for an email that just says "yes" each time someone says yes
  // (2026-11-09). Sent to his inbox only, after the visitor already has their answer.
  if (body.answer === "yes") {
    after(() => notifyThomas("yes", "yes", ""));
  }
  return NextResponse.json({ ok: true });
}
