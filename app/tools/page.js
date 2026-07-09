// Tools Index Page - Lists all available tools
import { getPageSeo } from '@/lib/get-page-seo'
import ToolsIndexClient from './ToolsIndexClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('tools')
  const title = seo.title || 'AI Publishing Tools for KDP & Etsy \u2014 ProCreators'
  const description = seo.description || 'Complete AI toolkit for Amazon KDP publishers and Etsy sellers. Ebook creator, cover designer, interior page builder, coloring book generator, journal maker, and Amazon listing writer.'

  return {
    title: { absolute: title },
    description: description,
    keywords: seo.keywords || 'KDP AI tools, Etsy printable AI, ebook creator, KDP cover designer, journal maker, coloring book AI',
    alternates: { canonical: 'https://procreators.io/tools' },
    openGraph: {
      title: title,
      description: description,
      url: 'https://procreators.io/tools',
    },
  }
}

export default function ToolsPage() {
  return <ToolsIndexClient />
}
