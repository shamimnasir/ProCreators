import { StaticPage } from '@/components/StaticPage'
import { getPageSeo } from '@/lib/get-page-seo'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('solutions-creators')
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

export default function CreatorsPage() {
  return <StaticPage pageId="solutions-creators" />
}
