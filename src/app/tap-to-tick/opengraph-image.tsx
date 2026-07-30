import { ImageResponse } from 'next/og'

/* The preview card for a Tap to Tick link — the app's own green, not the
   Kingdom Sites blue, since this page is the app's site. */

export const alt = 'Tap to Tick — a frictionless expense tracker for iPhone'
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
          background: 'linear-gradient(150deg, #ffffff 0%, #fafafa 50%, #eef7f0 100%)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#34C759',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 18,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 100 100">
                <path
                  d="M22 52l18 18 38-40"
                  stroke="#fff"
                  strokeWidth="13"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ display: 'flex', fontSize: 36, color: '#1c1c1e', letterSpacing: -1 }}>
              Tap to Tick
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 40,
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: -3,
              color: '#1c1c1e',
            }}
          >
            Tap it. Tick it. Done.
          </div>
          <div style={{ display: 'flex', marginTop: 26, fontSize: 34, color: '#6e6e73', maxWidth: 860 }}>
            A frictionless expense tracker — including the cash in your pocket.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 27, color: '#248A3D' }}>
          Free on the App Store · iPhone, Apple Watch, Lock Screen
        </div>
      </div>
    ),
    { ...size }
  )
}
