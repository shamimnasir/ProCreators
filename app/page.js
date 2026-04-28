// Homepage - Server Component with Dynamic Metadata
import { getPageSeo } from '@/lib/get-page-seo'
import { headers } from 'next/headers'
import HomeClient from './HomeClient'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Generate metadata from database
export async function generateMetadata() {
  const seo = await getPageSeo('homepage')
  
  // Detect the actual host from the incoming request so OG URLs always match the domain
  // This ensures procreators.io gets procreators.io URLs, not preview URLs
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || ''
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const detectedBase = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_BASE_URL || 'https://procreators.io')
  
  console.log('[Homepage] generateMetadata called, title:', seo.title, 'baseUrl:', detectedBase)
  
  // Use static OG image for maximum compatibility with Twitter/X, Facebook, LinkedIn, etc.
  const ogImageUrl = seo.ogImage || `${detectedBase}/og-image.png`
  
  return {
    metadataBase: new URL(detectedBase),
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: 'website',
      siteName: 'ProCreators',
      url: detectedBase,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: 'ProCreators - AI Content Creation Platform | 70+ Tools',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@procreators',
      creator: '@procreators',
      title: seo.title,
      description: seo.description,
      images: [ogImageUrl],
    },
    ...(seo.canonical && { alternates: { canonical: seo.canonical } }),
    icons: {
      icon: '/favicon.svg',
    },
  }
}

// Server component that renders the client homepage
export default function HomePage() {
  return <HomeClient />
}
