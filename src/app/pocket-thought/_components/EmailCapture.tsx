"use client";

import { useId, useState } from "react";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error" | "off">("idle");
  const id = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/pocket-thought/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });
      if (res.ok) return setState("done");
      const data = (await res.json()) as { error?: string };
      setState(data.error === "not_connected" ? "off" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <p className="text-center text-base font-medium">Thank you. You’re on the list.</p>;
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md">
      <label htmlFor={id} className="block text-center text-sm font-medium">
        Get updates by email
      </label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-12 w-full rounded-full bg-white px-5 sm:flex-1 text-base ring-1 ring-black/15 outline-none focus:ring-[var(--ink)]"
        />
        <input
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hidden"
          name="company"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="h-12 rounded-full bg-[var(--ink)] px-6 text-base font-medium text-white hover:bg-black disabled:bg-black/30"
        >
          {state === "busy" ? "Saving…" : "Sign up"}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-center text-sm text-red-700">That did not save. Please check the address and try again.</p>
      )}
      {state === "off" && <p className="mt-2 text-center text-sm">Email sign-up is not connected yet.</p>}
    </form>
  );
}
