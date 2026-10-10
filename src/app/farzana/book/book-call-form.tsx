"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";

import { trackEvent } from "@/lib/analytics";

import { buttonClass } from "../_ui/button";
import { CONTACT_EMAIL } from "../_ui/contact";
import {
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Spinner,
  Textarea,
} from "../_ui/fields";

/**
 * Asking for a call: a name, an email, and three optional lines — what they
 * teach, when suits them, anything else. It posts to the site's enquiry route
 * (`/api/inquiry`) marked as a Farzana call request, which emails Thomas, and
 * says plainly what happened. When the email cannot go, it offers
 * the address to write to instead, so a request is never simply lost.
 *
 * The hidden `company` field and the time since the form opened are the spam
 * checks the route reads; a person never sees either.
 */

type Fields = {
  name: string;
  email: string;
  teaches: string;
  times: string;
  message: string;
};

const EMPTY: Fields = { name: "", email: "", teaches: "", times: "", message: "" };

const SUBMIT_TIMEOUT_MS = 12_000;

export function BookCallForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  function set(key: keyof Fields) {
    return (event: { target: { value: string } }) => {
      setFields((current) => ({ ...current, [key]: event.target.value }));
      if (status === "error") setStatus("idle");
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
        body: JSON.stringify({
          ...fields,
          kind: "farzana-call",
          company,
          elapsedMs: Date.now() - openedAt.current,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error || "That could not be sent just now.");
        setStatus("error");
        trackEvent("farzana_call_error", { status: response.status });
        return;
      }
      trackEvent("farzana_call_request");
      setStatus("sent");
    } catch (caught) {
      const timedOut =
        caught instanceof DOMException &&
        (caught.name === "TimeoutError" || caught.name === "AbortError");
      setError(
        timedOut
          ? "That took too long. Try again, or email me instead."
          : "Could not reach the server. Your connection may have dropped.",
      );
      setStatus("error");
    }
  }

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    fields.name.trim()
      ? `Call request from ${fields.name.trim()}`
      : "Farzana call request",
  )}&body=${encodeURIComponent(
    [
      fields.teaches && `I teach: ${fields.teaches}`,
      fields.times && `When suits me: ${fields.times}`,
      fields.message,
    ]
      .filter(Boolean)
      .join("\n\n"),
  )}`;

  if (status === "sent") {
    const first = fields.name.trim().split(/\s+/)[0] || "thanks";
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-accent-wash text-primary">
          <CheckCircleIcon className="size-7" />
        </span>
        <h2>Got it, {first}.</h2>
        <p className="text-muted">
          Your request is in my inbox. I’ll reply within a day with a time
          that works.
        </p>
        <p className="text-sm text-muted">
          Prefer email? Write to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary underline-offset-4 hover:underline focus-visible:underline"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset disabled={sending} className="contents">
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="book-name">Your name</FieldLabel>
              <Input
                id="book-name"
                autoComplete="name"
                value={fields.name}
                onChange={set("name")}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="book-email">Email</FieldLabel>
              <Input
                id="book-email"
                type="email"
                autoComplete="email"
                value={fields.email}
                onChange={set("email")}
                required
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="book-teaches">
              What do you teach?{" "}
              <span className="font-normal text-muted">(optional)</span>
            </FieldLabel>
            <Input
              id="book-teaches"
              placeholder="Latin for homeschool families"
              value={fields.teaches}
              onChange={set("teaches")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="book-times">
              When suits you?{" "}
              <span className="font-normal text-muted">(optional)</span>
            </FieldLabel>
            <Input
              id="book-times"
              placeholder="Weekday mornings, Central time"
              value={fields.times}
              onChange={set("times")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="book-message">
              Anything else?{" "}
              <span className="font-normal text-muted">(optional)</span>
            </FieldLabel>
            <Textarea
              id="book-message"
              rows={4}
              placeholder="What you use today, how many students, what is eating your week"
              value={fields.message}
              onChange={set("message")}
            />
          </Field>
        </FieldGroup>

        {/* For bots only: hidden from people and from screen readers. */}
        <div
          aria-hidden
          className="absolute -start-[9999px] top-0 size-0 overflow-hidden"
        >
          <label htmlFor="book-company">Company</label>
          <input
            id="book-company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>
      </fieldset>

      {status === "error" ? (
        <p className="text-sm text-destructive">
          {error}{" "}
          <a
            href={mailto}
            className="font-medium underline-offset-4 hover:underline focus-visible:underline"
          >
            Email {CONTACT_EMAIL}
          </a>
        </p>
      ) : null}

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={sending}
          className={buttonClass({ size: "lg" })}
        >
          {sending ? <Spinner /> : "Request a call"}
        </button>
        <span className="text-sm text-muted">I reply within a day.</span>
      </div>
    </form>
  );
}
