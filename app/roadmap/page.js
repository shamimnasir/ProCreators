// Roadmap Page - Server Component with Dynamic Metadata
import { getPageSeo } from '@/lib/get-page-seo'
import RoadmapClient from './RoadmapClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('roadmap')
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : [],
    },
  }
}

export default function RoadmapPage() {
  return <RoadmapClient />
}
