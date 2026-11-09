"use client";

import { useEffect, useId, useState } from "react";
import { PRICE_USD, type Answer } from "../_lib/config";

const KEY = "pocket-thought-answer";

const CHOICES: [Answer, string][] = [
  ["yes", `Yes, at $${PRICE_USD}`],
  ["maybe", "Maybe, if it cost less"],
  ["no", "No"],
];

const THANKS: Record<Answer, string> = {
  yes: "Thank you. Leave your email and you’ll hear first when it’s ready to order.",
  maybe: "Thank you. Leave your email if you’d like to hear when it’s ready, and what it costs.",
  no: "Thank you for the honest answer. It helps more than a polite yes.",
};

function remembered(): Answer | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "yes" || v === "maybe" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

export default function BuyQuestion() {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [mail, setMail] = useState<"idle" | "busy" | "done" | "error">("idle");
  const id = useId();

  useEffect(() => {
    const a = remembered();
    if (a) setAnswer(a);
  }, []);

  async function choose(a: Answer) {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/pocket-thought/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: a, company }),
      });
      if (!res.ok) throw new Error(String(res.status));
      try {
        localStorage.setItem(KEY, a);
      } catch {}
      setAnswer(a);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setMail("busy");
    try {
      const res = await fetch("/api/pocket-thought/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company, answer }),
      });
      setMail(res.ok ? "done" : "error");
    } catch {
      setMail("error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-6 text-center ring-1 ring-black/10 sm:p-10">
      <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        Would you buy Pocket Thought for ${PRICE_USD}?
      </h2>
      <p className="mt-3 text-base text-[var(--muted)]">
        One price, finding built in, no subscription. It isn’t on sale yet. Your answer decides whether it gets built.
      </p>

      {!answer && (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {CHOICES.map(([a, label]) => (
              <button
                key={a}
                type="button"
                disabled={busy}
                onClick={() => choose(a)}
                className={
                  a === "yes"
                    ? "inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--ink)] px-7 text-base font-medium text-white hover:bg-black disabled:bg-black/30"
                    : "inline-flex min-h-[48px] items-center justify-center rounded-full px-7 text-base font-medium text-[var(--ink)] ring-1 ring-black/20 hover:ring-black/50 disabled:opacity-40"
                }
              >
                {label}
              </button>
            ))}
          </div>
          <input
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="hidden"
            name="company"
          />
          {error && <p className="mt-3 text-sm text-red-700">That didn’t save. Please try again.</p>}
        </>
      )}

      {answer && (
        <div className="mt-8" aria-live="polite">
          <p className="text-lg font-medium">{THANKS[answer]}</p>
          {answer !== "no" && mail !== "done" && (
            <form onSubmit={subscribe} className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row">
              <label htmlFor={id} className="sr-only">
                Email (optional)
              </label>
              <input
                id={id}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com (optional)"
                className="h-12 w-full rounded-full bg-white px-5 text-base ring-1 ring-black/15 outline-none focus:ring-[var(--ink)] sm:flex-1"
              />
              <button
                type="submit"
                disabled={mail === "busy"}
                className="h-12 rounded-full bg-[var(--ink)] px-6 text-base font-medium text-white hover:bg-black disabled:bg-black/30"
              >
                {mail === "busy" ? "Saving…" : "Keep me posted"}
              </button>
            </form>
          )}
          {mail === "done" && <p className="mt-4 text-base">You’re on the list.</p>}
          {mail === "error" && (
            <p className="mt-2 text-sm text-red-700">That didn’t save. Please check the address and try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
