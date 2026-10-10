"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarCheckIcon, UserIcon } from "@phosphor-icons/react";

import { buttonClass } from "../_ui/button";
import { ABOUT_PATH, BOOK_PATH } from "../_ui/contact";
import photo from "../../../../public/farzana/thomas-and-monisha.jpg";

import { Eyebrow, Reveal } from "./shared";

/**
 * Who you talk to. People come to Farzana told to "talk to Thomas", so the
 * front page shows him: a photo of Thomas and his wife Monisha, and three
 * sentences, with the call to book beside them. A short "Hi, I'm Thomas" video
 * takes the photo's place once it is recorded.
 */
export const HELLO =
  "I build Farzana, and when you book a call, you’re talking to me. I’m a Classical Conversations graduate who learned Latin the hard way, and I build software for people who just want it to be clear. Monisha is my wife; we want to do ministry, and Farzana fuels it.";

export function MeetThomas() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
      <Reveal>
        <div className="surface-card flex flex-col items-start gap-8 rounded-lg p-6 sm:flex-row sm:items-center sm:p-10">
          <figure className="flex w-full shrink-0 flex-col gap-2 sm:w-72">
            <Image
              src={photo}
              alt="Thomas and his wife Monisha, smiling side by side at a table"
              placeholder="blur"
              sizes="(min-width: 640px) 288px, 100vw"
              className="aspect-[4/3] h-auto w-full rounded-md object-cover"
            />
            <figcaption className="text-caption">Thomas and his wife, Monisha</figcaption>
          </figure>
          <div className="flex flex-col items-start gap-4">
            <Eyebrow>Who you’ll talk to</Eyebrow>
            <h2 className="text-balance sm:text-[36px] sm:leading-[43px]">Hi, I’m Thomas.</h2>
            <p className="max-w-2xl text-pretty text-lg text-muted">{HELLO}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={BOOK_PATH} className={buttonClass()}>
                <CalendarCheckIcon weight="bold" />
                Book a 15-minute call
              </Link>
              <Link
                href={ABOUT_PATH}
                className={buttonClass({ variant: "outline", className: "bg-surface" })}
              >
                <UserIcon weight="bold" />
                More about me
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/** The same introduction, small, beside the booking form. */
export function ThomasNote() {
  return (
    <div className="flex items-center gap-4 rounded-md bg-wash p-4">
      <Image
        src={photo}
        alt="Thomas and his wife Monisha"
        placeholder="blur"
        sizes="112px"
        className="aspect-[4/3] w-28 shrink-0 rounded-sm object-cover"
      />
      <p className="text-sm text-ink">
        <span className="font-medium text-heading">Hi, I’m Thomas.</span> You’ll be talking to
        me. I read every request and reply with a time.
      </p>
    </div>
  );
}
