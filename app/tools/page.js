// Tools Index Page - Lists all available tools
import { getPageSeo } from '@/lib/get-page-seo'
import ToolsIndexClient from './ToolsIndexClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('tools')
  const title = seo.title || 'All AI Tools | ProCreators'
  const description = seo.description || 'Explore 60+ AI-powered tools for content creation, video editing, marketing, education, and more.'
  
  return {
    title: { absolute: title },
    description: description,
    keywords: seo.keywords || 'AI tools, content creation, video tools, marketing tools',
    openGraph: {
      title: title,
      description: description,
    },
  }
}

export default function ToolsPage() {
  return <ToolsIndexClient />
}
