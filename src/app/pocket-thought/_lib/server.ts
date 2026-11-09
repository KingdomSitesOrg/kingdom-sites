import { createHash, randomBytes } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import type { Answer } from "./config";

/**
 * Keeps one sign-up. Production: the site's private Vercel Blob store, one file per
 * address under pocket-thought/emails/. A dev server: .data/pocket-thought/emails.jsonl.
 * Nothing here sends email.
 */
export async function storeSignup(
  email: string,
  answer?: Answer,
): Promise<"ok" | "not_connected"> {
  const at = new Date().toISOString();
  const row = answer ? { email, at, answer } : { email, at };
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    const id = createHash("sha256").update(email).digest("hex").slice(0, 32);
    await put(`pocket-thought/emails/${id}.json`, JSON.stringify(row), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return "ok";
  }
  if (process.env.VERCEL) return "not_connected";
  const dir = path.join(process.cwd(), ".data", "pocket-thought");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "emails.jsonl"), JSON.stringify(row) + "\n");
  return "ok";
}

/**
 * Keeps one answer to "Would you buy it at the planned price?". Production: one private
 * Vercel Blob file per answer under pocket-thought/answers/. A dev server:
 * .data/pocket-thought/answers.jsonl. No personal data: the email, if given, goes through storeSignup.
 */
export async function storeAnswer(
  answer: Answer,
  price: number,
): Promise<"ok" | "not_connected"> {
  const at = new Date().toISOString();
  const row = { answer, price, at };
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    const id = `${at.replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}`;
    await put(`pocket-thought/answers/${id}.json`, JSON.stringify(row), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return "ok";
  }
  if (process.env.VERCEL) return "not_connected";
  const dir = path.join(process.cwd(), ".data", "pocket-thought");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "answers.jsonl"), JSON.stringify(row) + "\n");
  return "ok";
}
