import { ImageResponse } from 'next/og'

/* The preview card for a /latin-game link — the game's own navy, gold, and
   crimson, since this page carries the game's identity rather than the site's. */

export const alt = 'A Latin practice game — march from Rōma to Gallia and learn real Latin'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '76px 80px',
          background: '#1b2440',
          borderBottom: '14px solid #E8B923',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: '#E8B923',
            }}
          >
            A Latin practice game
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 34,
              fontSize: 80,
              lineHeight: 1.1,
              letterSpacing: -2,
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex' }}>March from Rōma to Gallia.</div>
            <div style={{ display: 'flex', color: '#E8B923' }}>Learn real Latin on the way.</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.72)', maxWidth: 900 }}>
            Declensions, verb endings, and sentences you can actually read — one city at a time.
          </div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: 26, color: 'rgba(255,255,255,0.45)' }}>
            Built for Jam with Latin · kingdom-sites.com/latin-game
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
