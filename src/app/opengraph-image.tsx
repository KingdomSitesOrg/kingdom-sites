import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

/* The picture that shows up when a kingdom-sites.com link is pasted into
   iMessage, Facebook, WhatsApp, or Slack. Generated at build time rather than
   kept as an image file, so the words on it can never drift from the site.

   Without this, each app guesses at an image from the page — iMessage was
   picking the photo off the home page on its own. Same photo here, deliberately,
   beside the name and what I do. */

export const alt = 'Kingdom Sites — websites, mobile apps, and custom software'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  let photo: string | null = null
  try {
    const file = await readFile(join(process.cwd(), 'public/Photos/about.jpg'))
    photo = `data:image/jpeg;base64,${file.toString('base64')}`
  } catch {
    // No photo is better than no card at all — the text side stands on its own.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(150deg, #ffffff 0%, #f5f7fa 55%, #e7ecf5 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '72px 64px',
            width: photo ? 700 : 1200,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: '#0a63c9',
              }}
            >
              Kingdom Sites
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 28,
                fontSize: 68,
                lineHeight: 1.08,
                letterSpacing: -2,
                color: '#15181d',
              }}
            >
              Software that moves your business forward.
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 30,
                height: 6,
                width: 120,
                background: '#0a63c9',
                borderRadius: 3,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 30, color: '#575d67' }}>
              Websites · Mobile apps · Platforms · AI
            </div>
            <div style={{ display: 'flex', marginTop: 14, fontSize: 26, color: '#838a94' }}>
              kingdom-sites.com
            </div>
          </div>
        </div>

        {photo && (
          <div style={{ display: 'flex', width: 500, height: '100%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              width={500}
              height={630}
              style={{ objectFit: 'cover', objectPosition: '50% 35%' }}
            />
          </div>
        )}
      </div>
    ),
    { ...size }
  )
}
