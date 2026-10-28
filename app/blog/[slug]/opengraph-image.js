// Sprint P2 — Per-post dynamic OG image for /blog/[slug].
// Automatically renders a branded 1200x630 PNG for every blog post using its
// title + category from the DB. Falls back to a default if the post isn't found.
import { ImageResponse } from 'next/og'
import { connectToDatabase } from '@/lib/mongodb'

export const runtime = 'nodejs' // Needs MongoDB access, so not 'edge'
export const alt = 'ProCreators Blog Post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }) {
  const { slug } = await params
  let post = null
  try {
    const { db } = await connectToDatabase()
    post = await db.collection('blog_posts').findOne({ slug, isPublished: true })
  } catch (e) {
    // ignore - fallback below
  }

  const title = post?.title || 'The ProCreators Blog'
  const category = post?.category || 'KDP & Etsy Publishing'
  const readTime = post?.readTime || '5 min read'
  const author = post?.author || 'ProCreators Team'

  // Trim overly long titles so they don't overflow
  const shortTitle = title.length > 110 ? title.slice(0, 108).trim() + '…' : title

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
          background: 'linear-gradient(135deg, #fff7ed 0%, #fdf2f8 50%, #eff6ff 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: 320,
            background: 'radial-gradient(circle at 40% 40%, rgba(219,39,119,0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -140,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: 400,
            background: 'radial-gradient(circle at 60% 60%, rgba(234,88,12,0.22) 0%, transparent 70%)',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              color: '#fff',
              fontWeight: 900,
            }}
          >
            P
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>ProCreators Blog</div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '8px 18px',
              borderRadius: 999,
              background: '#0f172a',
              color: '#fff',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontSize: shortTitle.length > 70 ? 54 : 62,
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.08,
              maxWidth: 1050,
              letterSpacing: -1.3,
            }}
          >
            {shortTitle}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 22, color: '#334155', display: 'flex', gap: 16 }}>
            <span>{author}</span>
            <span>·</span>
            <span>{readTime}</span>
          </div>
          <div style={{ fontSize: 22, color: '#1e293b', fontWeight: 800 }}>procreators.io/blog</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
