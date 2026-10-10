"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpenTextIcon,
  CalendarCheckIcon,
  HeartIcon,
} from "@phosphor-icons/react";

import { vars } from "../../_home/shared";
import { Badge } from "../../_ui/badge";
import { buttonClass } from "../../_ui/button";
import { BOOK_PATH } from "../../_ui/contact";
import { Diamond } from "../../_ui/diamond";
import photo from "../../../../../public/farzana/thomas-and-monisha.jpg";

/**
 * The About page's first screen: Thomas and his wife Monisha, the ministry
 * they want to do, and that Farzana fuels it. Three small notes float on the
 * photo's edges — where Thomas learned, what was hard, and who is on their
 * hearts — each on its own slow beat.
 */
export function AboutHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-16 px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:pb-28">
      <div className="flex flex-col items-start gap-6">
        <Badge className="fz-rise" style={vars({ "--d": "0ms" })}>
          <Diamond size={8} />
          About
        </Badge>
        <h1 className="fz-rise text-display text-balance" style={vars({ "--d": "80ms" })}>
          We’re Thomas and <span className="text-primary">Monisha.</span>
        </h1>
        <p className="fz-rise max-w-xl text-pretty text-lg text-muted" style={vars({ "--d": "200ms" })}>
          I build Farzana, and Monisha is my wife. We want to do ministry, and
          Farzana fuels it.
        </p>
        <div className="fz-rise" style={vars({ "--d": "300ms" })}>
          <Link href={BOOK_PATH} className={buttonClass({ size: "lg" })}>
            <CalendarCheckIcon weight="bold" />
            Book a 15-minute call
          </Link>
        </div>
      </div>

      <div className="fz-rise relative mx-auto w-full max-w-[560px]" style={vars({ "--d": "240ms" })}>
        <figure className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-lg border bg-surface">
            <Image
              src={photo}
              alt="Thomas and his wife Monisha, smiling side by side at a table"
              placeholder="blur"
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="h-auto w-full"
            />
          </div>
          <figcaption className="text-caption">Thomas and his wife, Monisha</figcaption>
        </figure>

        <Note className="-top-5 end-3 sm:-end-6 [animation:fz-float_7s_ease-in-out_infinite]">
          <Diamond size={12} />
          Classical Conversations graduate
        </Note>
        <Note className="top-1/2 -start-3 sm:-start-8 [animation:fz-float_8s_ease-in-out_1.2s_infinite]">
          <BookOpenTextIcon className="size-5 text-accent" />
          Learned Latin the hard way
        </Note>
        <Note className="bottom-4 end-3 sm:-end-6 [animation:fz-float_9s_ease-in-out_2.4s_infinite]">
          <HeartIcon className="size-5 text-accent" />
          A heart for Afghans and South Asians
        </Note>
      </div>
    </section>
  );
}

function Note({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div aria-hidden className={`fz-motion absolute ${className}`}>
      <div className="surface-card flex items-center gap-2 rounded-md px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-heading">
          {children}
        </span>
      </div>
    </div>
  );
}
