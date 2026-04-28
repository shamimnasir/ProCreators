// Blog Page - Server Component with Dynamic Metadata
import { getPageSeo } from '@/lib/get-page-seo'
import BlogClient from './BlogClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('blog')
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

export default function BlogPage() {
  return <BlogClient />
}
