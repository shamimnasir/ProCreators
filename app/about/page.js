import { getPageSeo } from '@/lib/get-page-seo'
import AboutClient from './AboutClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('about')
  const title = seo.title || 'About Us | ProCreators'
  return {
    title: { absolute: title },
    description: seo.description || 'Learn about ProCreators - the AI-powered content creation platform empowering creators worldwide.',
    keywords: seo.keywords || 'about, ProCreators, AI content, company',
  }
}

export default function AboutPage() {
  return <AboutClient />
}
