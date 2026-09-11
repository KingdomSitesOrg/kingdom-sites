This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Kingdom Sites Sign

Lightweight PDF e-sign built into this site (not a separate app).

### Routes

| Path | Purpose |
|------|---------|
| `/sign` | Redirects to dashboard or login |
| `/sign/login` | Admin login (`ADMIN_EMAIL` + `ADMIN_PASSWORD`) |
| `/sign/dashboard` | List envelopes |
| `/sign/new` | Upload a PDF |
| `/sign/envelopes/[id]` | Place fields, send magic links, audit log |
| `/sign/s/[token]` | Signer view (draw/type signature) |

### Setup

1. Copy `.env.example` values into `.env.local` (and Vercel env for production).
2. Required for Sign admin: `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Required to email magic links / completed PDFs: `RESEND_API_KEY` (already used by `/api/inquiry`). Prefer a verified `SIGN_FROM_EMAIL` / `LEAD_FROM_EMAIL` on your domain.
4. On Vercel, set `BLOB_READ_WRITE_TOKEN` so uploaded/completed PDFs persist. Locally, storage is `.data/sign/` (gitignored).
5. Optional: `SIGN_SESSION_SECRET`, `SIGN_APP_URL` (defaults to `https://kingdom-sites.com` when set, else `VERCEL_URL` / localhost).

```bash
npm run dev
# open http://localhost:3000/sign
```

### Flow

1. Admin signs in → uploads PDF → adds signers → clicks the preview to place signature/date fields → **Send magic links**.
2. Each signer opens `/sign/s/[token]`, reviews the PDF, draws or types a signature, submits.
3. When everyone has signed, the PDF is stamped with `pdf-lib`, stored, and emailed to signers + admin (via Resend).

### Out of scope (MVP)

Templates, bulk send, SSO, SMS, ID verification, payments, native apps.
