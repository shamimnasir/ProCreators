// Documentation Page - Server Component with Dynamic Metadata
import { getPageSeo } from '@/lib/get-page-seo'
import DocsClient from './DocsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('docs')
  const title = seo.title || 'Documentation | ProCreators'
  return {
    title: { absolute: title },
    description: seo.description || 'Step-by-step guides for all ProCreators AI tools. Learn how to create videos, images, content, and more.',
    keywords: seo.keywords || 'documentation, guides, tutorials, how to, ProCreators',
  }
}

export default function DocsPage() {
  return <DocsClient />
}
