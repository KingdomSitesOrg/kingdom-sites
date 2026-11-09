import { NextResponse } from "next/server";
import { validAnswer } from "@/app/pocket-thought/_lib/config";
import { storeSignup } from "@/app/pocket-thought/_lib/server";

// Pocket Thought email sign-ups are stored, never sent anything.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: unknown; company?: unknown; answer?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  // A hidden field that only bots fill in.
  if (typeof body.company === "string" && body.company.length > 0) {
    return NextResponse.json({ ok: true });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "bad_email" }, { status: 400 });
  }
  try {
    const result = await storeSignup(email, validAnswer(body.answer) ? body.answer : undefined);
    if (result === "not_connected") return NextResponse.json({ error: "not_connected" }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
