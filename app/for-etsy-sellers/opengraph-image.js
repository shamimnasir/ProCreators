// Sprint P2 — Branded OG image for /for-etsy-sellers landing page.
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ProCreators for Etsy Sellers — 13 tags, materials, and listings in seconds.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 40%, #fbcfe8 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              background: '#0f172a',
              color: '#fff',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            ProCreators
          </div>
          <div style={{ fontSize: 22, color: '#0f172a', fontWeight: 600 }}>for Etsy Sellers</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 22, color: '#831843', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 800 }}>
            The AI Studio for Etsy Shops
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.02,
              maxWidth: 1000,
              letterSpacing: -1.5,
            }}
          >
            13-tag Etsy listings, mockups &amp; digital products in minutes.
          </div>
          <div style={{ fontSize: 26, color: '#1e293b', maxWidth: 950, lineHeight: 1.3 }}>
            Prompt Packs &middot; Wedding Suites &middot; Planners &middot; Coloring Books &middot; Spreadsheet Templates.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 900 }}>
            {['13 optimized tags', 'Materials + personalization', 'Section suggestion', 'Structured description'].map((f) => (
              <div
                key={f}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.75)',
                  color: '#831843',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {f}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, color: '#1e293b', fontWeight: 800 }}>procreators.io/for-etsy-sellers</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
