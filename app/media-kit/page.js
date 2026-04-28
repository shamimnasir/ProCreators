import { getPageSeo } from '@/lib/get-page-seo'
import MediaKitClient from './MediaKitClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('media-kit')
  const title = seo.title || 'Media Kit | ProCreators'
  return {
    title: { absolute: title },
    description: seo.description || 'Download official ProCreators logos and brand assets for press, partnerships, and integrations.',
    keywords: seo.keywords || 'media kit, brand assets, logo, press kit, ProCreators',
  }
}

export default function MediaKitPage() {
  return <MediaKitClient />
}
