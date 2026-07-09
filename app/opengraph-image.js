// Sprint P2 — Site-wide default OG image for ProCreators.
// Rendered by Next.js at request time via next/og ImageResponse.
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ProCreators — AI Publishing Studio for Amazon KDP & Etsy Sellers'
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
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fed7aa 100%)',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Decorative corner accent */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: 320,
            background: 'radial-gradient(circle at 30% 30%, rgba(234,88,12,0.35) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: 400,
            background: 'radial-gradient(circle at 60% 60%, rgba(190,24,93,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Top: logotype + tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              color: '#fff',
              fontWeight: 900,
            }}
          >
            P
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#0f172a' }}>ProCreators</div>
            <div style={{ fontSize: 16, color: '#64748b' }}>The AI Publishing Studio</div>
          </div>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              fontSize: 20,
              color: '#c2410c',
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            For Amazon KDP &amp; Etsy Sellers
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.05,
              maxWidth: 980,
              letterSpacing: -1.5,
            }}
          >
            Publish complete digital products in under 2 hours.
          </div>
          <div style={{ fontSize: 26, color: '#334155', maxWidth: 900, lineHeight: 1.35 }}>
            Ebooks &middot; Planners &middot; Journals &middot; Coloring Books &middot; Etsy Listings — all in one studio.
          </div>
        </div>

        {/* Bottom: URL + product row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {['Ebook', 'Planner', 'Journal', 'Etsy Listing'].map((p) => (
              <div
                key={p}
                style={{
                  padding: '10px 20px',
                  borderRadius: 999,
                  background: 'rgba(15, 23, 42, 0.06)',
                  color: '#0f172a',
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {p}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, color: '#334155', fontWeight: 700 }}>procreators.io</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
