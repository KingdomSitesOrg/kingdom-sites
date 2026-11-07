"use client";

import { useId, useState } from "react";
import {
  CHECKOUT_LINE,
  MAX_CUSTOM_USD,
  MIN_CUSTOM_USD,
  TIERS,
  type PaymentSettings,
  validAmount,
} from "../_lib/config";

type Choice = number | "custom";

export default function ContributeBox({
  payments,
  thanked = false,
}: {
  payments: PaymentSettings;
  /** Back from a paid Stripe Checkout (?thanks=1). */
  thanked?: boolean;
}) {
  const [choice, setChoice] = useState<Choice>(50);
  const [custom, setCustom] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [thanks, setThanks] = useState(thanked);
  const agreeId = useId();
  const customId = useId();

  const amount = choice === "custom" ? Number(custom) : choice;
  const amountOk = validAmount(amount);
  const ready = agreed && amountOk && !busy;

  async function payWithCard() {
    if (!ready) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/pocket-thought/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, agreed }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMessage(
        data.error === "not_connected"
          ? "Card payments are not connected yet."
          : "Card payment could not start. Please try again.",
      );
    } catch {
      setMessage("Card payment could not start. Please try again.");
    }
    setBusy(false);
  }

  function external(url: string) {
    if (!ready) return;
    window.open(url, "_blank", "noopener,noreferrer");
    setThanks(true);
  }

  if (thanks) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/5 sm:p-10">
        <p className="text-2xl font-semibold tracking-tight">Thank you.</p>
        <p className="mt-3 text-[var(--muted)]">Your support helps make the first Pocket Thought prototype real.</p>
        <button
          type="button"
          onClick={() => {
            setThanks(false);
            window.history.replaceState(null, "", window.location.pathname + "#support");
          }}
          className="mt-6 text-sm font-medium text-[var(--ink)] underline underline-offset-4"
        >
          Back to contribution options
        </button>
      </div>
    );
  }

  const paypalHref = payments.paypalUrl && amountOk ? `${payments.paypalUrl}/${amount}USD` : null;
  const venmoHref =
    payments.venmoUser && amountOk
      ? `https://venmo.com/${payments.venmoUser}?txn=pay&amount=${amount}&note=${encodeURIComponent("Pocket Thought prototype support")}`
      : null;

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 sm:p-8">
      <fieldset>
        <legend className="sr-only">Contribution amount</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TIERS.map((t) => (
            <button
              key={t.amount}
              type="button"
              aria-pressed={choice === t.amount}
              onClick={() => setChoice(t.amount)}
              className={`flex min-h-[76px] flex-col items-center justify-center rounded-2xl px-3 py-3 ring-1 transition ${
                choice === t.amount
                  ? "bg-[var(--ink)] text-white ring-[var(--ink)]"
                  : "bg-[var(--panel)] ring-transparent hover:ring-black/15"
              }`}
            >
              <span className="text-xl font-semibold">${t.amount}</span>
              <span className={`text-xs ${choice === t.amount ? "text-white/75" : "text-[var(--muted)]"}`}>
                {t.name}
              </span>
            </button>
          ))}
          <button
            type="button"
            aria-pressed={choice === "custom"}
            onClick={() => setChoice("custom")}
            className={`col-span-2 flex min-h-[76px] flex-col items-center justify-center rounded-2xl px-3 py-3 ring-1 transition sm:col-span-2 ${
              choice === "custom"
                ? "bg-[var(--ink)] text-white ring-[var(--ink)]"
                : "bg-[var(--panel)] ring-transparent hover:ring-black/15"
            }`}
          >
            <span className="text-xl font-semibold">Custom</span>
            <span className={`text-xs ${choice === "custom" ? "text-white/75" : "text-[var(--muted)]"}`}>
              Any amount
            </span>
          </button>
        </div>
      </fieldset>

      {choice === "custom" && (
        <div className="mt-4">
          <label htmlFor={customId} className="text-sm font-medium">
            Amount in US dollars
          </label>
          <div className="mt-2 flex items-center rounded-2xl bg-[var(--panel)] px-4 ring-1 ring-black/10 focus-within:ring-[var(--ink)]">
            <span className="text-lg text-[var(--muted)]">$</span>
            <input
              id={customId}
              inputMode="numeric"
              pattern="[0-9]*"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
              placeholder="75"
              className="h-12 w-full bg-transparent px-2 text-lg outline-none"
            />
          </div>
          {custom !== "" && !amountOk && (
            <p className="mt-2 text-sm text-red-700">
              Enter a whole amount from ${MIN_CUSTOM_USD} to ${MAX_CUSTOM_USD.toLocaleString()}.
            </p>
          )}
        </div>
      )}

      <label
        htmlFor={agreeId}
        className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--panel)] p-4 text-sm leading-relaxed"
      >
        <input
          id={agreeId}
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ink)]"
        />
        <span>{CHECKOUT_LINE}</span>
      </label>

      <div className="mt-5 grid gap-3">
        <PayButton
          primary
          disabled={!ready || !payments.stripe}
          onClick={payWithCard}
          label={busy ? "Opening checkout…" : amountOk ? `Contribute $${amount} by card` : "Contribute by card"}
          note={payments.stripe ? null : "Not connected yet"}
        />
        <div className="grid grid-cols-2 gap-3">
          <PayButton
            disabled={!ready || !paypalHref}
            onClick={() => paypalHref && external(paypalHref)}
            label="PayPal"
            note={payments.paypalUrl ? null : "Not connected yet"}
          />
          <PayButton
            disabled={!ready || !venmoHref}
            onClick={() => venmoHref && external(venmoHref)}
            label="Venmo"
            note={payments.venmoUser ? null : "Not connected yet"}
          />
        </div>
      </div>
      {!agreed && (
        <p className="mt-3 text-center text-xs text-[var(--muted)]">Tick the box above to continue.</p>
      )}
      {message && (
        <p role="status" className="mt-3 text-center text-sm text-[var(--ink)]">
          {message}
        </p>
      )}
    </div>
  );
}

function PayButton({
  label,
  note,
  disabled,
  onClick,
  primary,
}: {
  label: string;
  note: string | null;
  disabled: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[52px] flex-col items-center justify-center rounded-full px-5 py-2 text-base font-medium transition disabled:cursor-not-allowed ${
        primary
          ? "bg-[var(--ink)] text-white hover:bg-black disabled:bg-black/25"
          : "bg-white text-[var(--ink)] ring-1 ring-black/15 hover:ring-black/40 disabled:text-black/35 disabled:ring-black/10"
      }`}
    >
      <span>{label}</span>
      {note && <span className="text-[11px] font-normal opacity-80">{note}</span>}
    </button>
  );
}
