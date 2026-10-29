import { ImageResponse } from 'next/og'
import { JOIN_GIFT } from '@/lib/referrals'

/**
 * The link preview card for the referral program (T-293, Thomas, 2026-10-29):
 * what iMessage, WhatsApp and the rest show when someone pastes /refer, a
 * personal link (/r/<code>) or a tracker. The Kingdom Sites mark and a big
 * $500; a personal link adds "Anna sent you here." under it (T-297: no
 * tagline). 1200x630, drawn by Next's `opengraph-image` files.
 */

export const CARD_SIZE = { width: 1200, height: 630 }
export const CARD_TYPE = 'image/png'

export function referralCard(line?: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          background: '#f5f7fa',
          borderBottom: '14px solid #0a63c9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0a63c9',
              borderRadius: 16,
              color: '#ffffff',
              fontSize: 42,
              fontWeight: 700,
            }}
          >
            K
          </div>
          <div style={{ display: 'flex', marginLeft: 22, fontSize: 40, fontWeight: 700, color: '#15181d' }}>
            Kingdom Sites
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 210,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -6,
              color: '#16a34a',
            }}
          >
            {`$${JOIN_GIFT}`}
          </div>
          {line ? (
            <div
              style={{
                display: 'flex',
                marginTop: 26,
                maxWidth: 1040,
                fontSize: 50,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: -1,
                color: '#15181d',
              }}
            >
              {line}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', fontSize: 28, color: '#575d67' }}>
          {`Refer someone who needs software · kingdom-sites.com/refer`}
        </div>
      </div>
    ),
    { ...CARD_SIZE },
  )
}
