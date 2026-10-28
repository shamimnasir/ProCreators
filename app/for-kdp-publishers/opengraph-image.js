// Sprint P2 — Branded OG image for /for-kdp-publishers landing page.
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ProCreators for Amazon KDP Publishers — Publish faster, sell more.'
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
          background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 60%, #f97316 100%)',
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
          <div style={{ fontSize: 22, color: '#0f172a', fontWeight: 600 }}>for Amazon KDP</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 22, color: '#0f172a', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 800 }}>
            The AI Studio for KDP Publishers
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
            Go from niche idea to Amazon-ready book in an afternoon.
          </div>
          <div style={{ fontSize: 26, color: '#1e293b', maxWidth: 950, lineHeight: 1.3 }}>
            Journals &middot; Planners &middot; Puzzle Books &middot; Recipe Books &middot; Ebooks &middot; Covers — all AI powered.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 900 }}>
            {['Low-content books', 'Series generator', 'EPUB export', 'KDP-ready PDFs'].map((f) => (
              <div
                key={f}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.7)',
                  color: '#7c2d12',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {f}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, color: '#1e293b', fontWeight: 800 }}>procreators.io/for-kdp-publishers</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
