// Sprint P2 — Branded OG image for /blog index page.
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'The ProCreators Blog — KDP & Etsy Publishing Guides'
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
          padding: 80,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color: '#fff',
              fontWeight: 900,
            }}
          >
            P
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>ProCreators Blog</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 22, color: '#4f46e5', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 800 }}>
            KDP &amp; Etsy Publishing Guides
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.04,
              maxWidth: 1000,
              letterSpacing: -1.5,
            }}
          >
            Actionable playbooks for publishing your next digital product.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 22, color: '#334155' }}>Niche research &middot; Pricing &middot; Covers &middot; Etsy SEO</div>
          <div style={{ fontSize: 22, color: '#1e293b', fontWeight: 800 }}>procreators.io/blog</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
