#!/usr/bin/env node
// Counts the answers to "Would you buy it?" on kingdom-sites.com/pocket-thought.
//
// Read-only: it lists and reads the private files the page saves in the site's
// Vercel Blob store, and never writes, changes or deletes anything.
//   pocket-thought/answers/  one file per answer: { answer: yes|maybe|no, price, at }
//   pocket-thought/emails/   one file per address: { email, at, answer? }
//
// Needs BLOB_READ_WRITE_TOKEN, for example from `vercel env pull`:
//   node --env-file=<pulled env file> scripts/pocket-thought-answers.mjs [--emails]
// --emails also lists the addresses left, grouped by answer.

import { get, list } from "@vercel/blob";

if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
  console.error("BLOB_READ_WRITE_TOKEN is not set.");
  process.exit(1);
}

async function readAll(prefix) {
  const rows = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const r = await get(b.pathname, { access: "private", useCache: false });
      if (r?.statusCode === 200) {
        rows.push(JSON.parse(await new Response(r.stream).text()));
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return rows;
}

const answers = await readAll("pocket-thought/answers/");
const emails = await readAll("pocket-thought/emails/");

const count = (rows, a) => rows.filter((r) => r.answer === a).length;
const dates = answers.map((r) => r.at).sort();

console.log(`Answers: ${answers.length}`);
for (const a of ["yes", "maybe", "no"]) {
  const n = count(answers, a);
  const pct = answers.length ? Math.round((n / answers.length) * 100) : 0;
  console.log(`  ${a.padEnd(5)} ${String(n).padStart(4)}  (${pct}%)`);
}
if (dates.length) {
  console.log(`  first ${dates[0]}, latest ${dates[dates.length - 1]}`);
}
console.log(`Emails left: ${emails.length}`);
for (const a of ["yes", "maybe"]) {
  console.log(`  after "${a}": ${count(emails, a)}`);
}

if (process.argv.includes("--emails")) {
  for (const a of ["yes", "maybe", "no", undefined]) {
    const list = emails.filter((r) => r.answer === a);
    if (!list.length) continue;
    console.log(`\n${a ?? "no answer recorded"}:`);
    for (const r of list) console.log(`  ${r.email}  ${r.at}`);
  }
}
